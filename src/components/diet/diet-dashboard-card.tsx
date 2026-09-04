"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePet } from "@/contexts/pet-context";
import type { DietCalculationResult } from "@/lib/diet-calculations";
import type { BirdNutritionResult } from "@/lib/nutrition/bird-calculator";
import { speciesUsesBirdNutrition } from "@/lib/species/registry";
import { createClient } from "@/lib/supabase/client";
import { DietPlanService } from "@/services/diet-plan-service";
import type { DietPlan } from "@/types/database";

function isBirdResult(result: unknown): result is BirdNutritionResult {
  return Boolean(result && typeof result === "object" && "suggestedPelletPercent" in result);
}

export function DietDashboardCard() {
  const { selectedPetId, selectedPet } = usePet();
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [completed, setCompleted] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    if (!selectedPetId) return;
    const service = new DietPlanService(supabase);
    const [current, today] = await Promise.all([
      service.getCurrent(selectedPetId),
      service.getTodayFeedingCompletions(selectedPetId),
    ]);
    setPlan(current);
    setCompleted(today.length);
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!selectedPet) return null;

  if (!plan) {
    return (
      <Card className="rounded-2xl border-dashed shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium">No nutrition plan yet</p>
            <p className="text-sm text-muted-foreground">
              Complete onboarding or update {selectedPet.name}&apos;s profile to generate a plan.
            </p>
          </div>
          <Button asChild size="sm" variant="secondary" className="rounded-xl">
            <Link href="/health/diet">Set up</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const result = plan.result as unknown;
  const isBird = speciesUsesBirdNutrition(selectedPet.species) || plan.engine_type === "bird";

  if (isBird && isBirdResult(result)) {
    return (
      <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-secondary shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Salad className="size-5 text-primary" />
              <p className="font-medium">Today&apos;s feeding guidance</p>
            </div>
            <Button asChild size="sm" variant="secondary" className="rounded-xl">
              <Link href="/health/diet">View plan</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Pellets {result.suggestedPelletPercent.min}–{result.suggestedPelletPercent.max}% · Seeds ≤
            {result.suggestedSeedPercentMax}% · Greens ≥{result.suggestedVegetablePercentMin}%
          </p>
          <p className="text-sm">{result.waterSchedule}</p>
          <p className="text-xs text-muted-foreground">
            Personalized calorie or feeding-quantity calculation is not available for birds yet.
            Confirm amounts with an avian veterinarian.
          </p>
        </CardContent>
      </Card>
    );
  }

  const mammal = result as DietCalculationResult;
  if (mammal.recommendationBlocked) {
    return (
      <Card className="rounded-2xl border-warning/40 bg-warning/10 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <p className="font-medium">Veterinary review recommended</p>
          <p className="text-sm text-muted-foreground">
            A routine calorie plan was not generated for this pet. Ask a veterinarian for
            individualized feeding amounts.
          </p>
          <Button asChild size="sm" variant="secondary" className="rounded-xl">
            <Link href="/health/diet">View details</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  const total = mammal.mealSchedule?.length ?? 0;
  const nextMeal = mammal.mealSchedule?.find((_, i) => i >= completed);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-secondary shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Salad className="size-5 text-primary" />
            <p className="font-medium">Today&apos;s feeding</p>
          </div>
          <Button asChild size="sm" variant="secondary" className="rounded-xl">
            <Link href="/health/diet">View plan</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Target: {mammal.merKcalMin}–{mammal.merKcalMax} kcal
          {mammal.dailyFoodGrams ? ` · ~${mammal.dailyFoodGrams}g` : ""}
          {mammal.treatAllowanceKcal ? ` · Treats ~${mammal.treatAllowanceKcal} kcal` : ""}
        </p>
        {nextMeal ? (
          <p className="text-sm">
            Next meal: {nextMeal.time} ({nextMeal.calories} kcal)
          </p>
        ) : total > 0 ? (
          <p className="text-sm text-success">All meals completed today</p>
        ) : null}
        {total > 0 ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {completed}/{total} meals
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
