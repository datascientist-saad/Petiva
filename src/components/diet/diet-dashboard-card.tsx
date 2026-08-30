"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import type { DietCalculationResult } from "@/lib/diet-calculations";
import { DietPlanService } from "@/services/diet-plan-service";
import type { DietPlan } from "@/types/database";

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

  if (!selectedPet || !plan) return null;

  const result = plan.result as unknown as DietCalculationResult;
  const total = result.mealSchedule?.length ?? 0;
  const nextMeal = result.mealSchedule?.find((_, i) => i >= completed);
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
          Target: {result.merKcalMin}–{result.merKcalMax} kcal
          {result.dailyFoodGrams ? ` · ~${result.dailyFoodGrams}g` : ""}
        </p>
        {nextMeal ? (
          <p className="text-sm">Next meal: {nextMeal.time} ({nextMeal.calories} kcal)</p>
        ) : (
          <p className="text-sm text-success">All meals completed today 🎉</p>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed}/{total} meals</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
