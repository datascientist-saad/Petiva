"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogMealDialog } from "@/components/forms/log-meal-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { foodConsumedToday, remainingFoodTarget } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatTime } from "@/lib/utils";
import { NutritionService } from "@/services/nutrition-service";
import type { MealLog } from "@/types/database";

export default function NutritionPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new NutritionService(supabase);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setMeals(await service.listMeals(selectedPetId, today.toISOString()));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const consumed = useMemo(
    () => (selectedPet ? foodConsumedToday(meals, selectedPet.food_unit) : 0),
    [meals, selectedPet]
  );
  const target = selectedPet?.daily_food_target ?? null;
  const remaining = remainingFoodTarget(consumed, target);
  const progress = target ? Math.min(100, Math.round((consumed / Number(target)) * 100)) : 0;

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view nutrition." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Nutrition</h1>
          <p className="text-sm text-muted-foreground">Today's meals for {selectedPet.name}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl">Log meal</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Daily progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {target ? (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-lg font-bold">{target} {selectedPet.food_unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Consumed</p>
                      <p className="text-lg font-bold">{consumed} {selectedPet.food_unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-lg font-bold">{remaining ?? 0} {selectedPet.food_unit}</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No daily target set yet. You can add one in {selectedPet.name}'s profile.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-accent/20 bg-accent/5">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Feeding amounts vary by age, activity, and health. Always check with your vet or follow your food manufacturer's guidance for {selectedPet.name}.
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Today's meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {meals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meals logged yet today.</p>
              ) : (
                meals.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                    <div>
                      <p className="font-medium">{m.food_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(m.logged_at)} · {m.amount} {m.unit}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedPetId && (
        <LogMealDialog
          petId={selectedPetId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadData}
          defaultUnit={selectedPet.food_unit}
        />
      )}
    </div>
  );
}
