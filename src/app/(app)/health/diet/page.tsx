"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Salad } from "lucide-react";
import { toast } from "sonner";
import { AlertBanner } from "@/components/shared/alert-banner";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import type { DietCalculationResult } from "@/lib/diet-calculations";
import { DietPlanService } from "@/services/diet-plan-service";
import type { DietPlan, Pet } from "@/types/database";

export default function DietPlanPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [completions, setCompletions] = useState<Array<{ meal_index: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vetNotes, setVetNotes] = useState("");
  const [vetApproved, setVetApproved] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    if (!selectedPetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const service = new DietPlanService(supabase);
      const [current, today] = await Promise.all([
        service.getCurrent(selectedPetId),
        service.getTodayFeedingCompletions(selectedPetId),
      ]);
      setPlan(current);
      setCompletions(today);
      setVetNotes(current?.vet_notes ?? "");
      setVetApproved(current?.vet_approved ?? false);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const result = plan?.result as unknown as DietCalculationResult | undefined;

  async function regenerate() {
    if (!selectedPet || !selectedPetId) return;
    setRegenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const service = new DietPlanService(supabase);
      const input = service.buildInputFromPet(selectedPet as Pet);
      if (!input) throw new Error("Add weight, diet goal, and food details on your pet profile first.");

      await service.savePlan(selectedPetId, user.id, input, {
        vetNotes,
        vetApproved,
        replace: true,
      });
      toast.success("Diet plan updated.");
      setConfirmOpen(false);
      void load();
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setRegenerating(false);
    }
  }

  async function toggleMeal(mealIndex: number, scheduledTime?: string) {
    if (!selectedPetId) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");
      const service = new DietPlanService(supabase);
      const done = completions.some((c) => c.meal_index === mealIndex);
      if (done) {
        await service.unmarkMealComplete(selectedPetId, mealIndex);
      } else {
        await service.markMealComplete(selectedPetId, user.id, mealIndex, scheduledTime);
      }
      void load();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view their diet plan." />;
  }

  if (loading) return <LoadingState message={`Loading ${selectedPet.name}'s diet plan…`} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (!plan || !result) {
    return (
      <div className="space-y-5">
        <PageHeader title="Diet plan" description={`Personalized nutrition for ${selectedPet.name}`} />
        <EmptyState
          title="No diet plan yet"
          description="Generate a plan based on your pet's profile."
          action={{
            label: "Generate plan",
            onClick: () => setConfirmOpen(true),
          }}
        />
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Generate diet plan?"
          description={`We'll create a personalized estimate for ${selectedPet.name} using their profile.`}
          confirmLabel="Generate"
          onConfirm={regenerate}
          loading={regenerating}
        />
      </div>
    );
  }

  const mealsDone = completions.length;
  const totalMeals = result.mealSchedule.length;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Diet plan"
        description={`Personalized nutrition for ${selectedPet.name}`}
        action={
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setConfirmOpen(true)}>
            <RefreshCw className="mr-2 size-4" />
            Regenerate
          </Button>
        }
      />

      {result.elevatedVetWarning ? (
        <AlertBanner variant="warning" title="Veterinarian review recommended">
          {result.safetyNotice}
        </AlertBanner>
      ) : (
        <AlertBanner>{result.safetyNotice}</AlertBanner>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Daily calories" value={`${result.merKcalMin}–${result.merKcalMax}`} hint="kcal range" />
        <MetricCard label="Meals / day" value={result.recommendedMealsPerDay} />
        <MetricCard
          label="Daily food"
          value={result.dailyFoodGrams != null ? `${result.dailyFoodGrams}g` : "Estimate"}
          hint={result.isEstimate ? "Confirm label calories" : undefined}
        />
        <MetricCard label="Treat allowance" value={`${result.treatAllowanceKcal} kcal`} hint="~10% of daily" />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Salad className="size-4 text-primary" />
            Today&apos;s feeding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {mealsDone} of {totalMeals} meals completed
          </p>
          {result.mealSchedule.map((meal) => {
            const done = completions.some((c) => c.meal_index === meal.mealIndex);
            return (
              <label
                key={meal.mealIndex}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 p-3"
              >
                <Checkbox checked={done} onCheckedChange={() => void toggleMeal(meal.mealIndex, meal.time)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{meal.label} · {meal.time}</p>
                  <p className="text-xs text-muted-foreground">{meal.calories} kcal target</p>
                </div>
              </label>
            );
          })}
        </CardContent>
      </Card>

      {(result.dryFoodGrams || result.wetFoodGrams) && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Mixed feeding breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            {result.dryFoodGrams ? <p>Dry: {result.dryFoodGrams}g/day ({result.perMealDryGrams}g/meal)</p> : null}
            {result.wetFoodGrams ? <p>Wet: {result.wetFoodGrams}g/day ({result.perMealWetGrams}g/meal)</p> : null}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Guidance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{result.hydrationGuidance}</p>
          <p>{result.adjustmentGuidance}</p>
          {result.warnings.map((w) => (
            <p key={w} className="text-warning">⚠️ {w}</p>
          ))}
          <p className="text-xs">Generated {new Date(plan.generated_at).toLocaleDateString()} · Review by {plan.review_by ?? "—"}</p>
          <div className="space-y-2 pt-2">
            <Label>Veterinarian notes</Label>
            <Textarea value={vetNotes} onChange={(e) => setVetNotes(e.target.value)} className="rounded-xl" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={vetApproved} onCheckedChange={(c) => setVetApproved(!!c)} />
              Veterinarian approved this plan
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/pets/${selectedPet.id}`}>Update pet profile</Link>
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replace current diet plan?"
        description="We'll save a new version and archive the previous plan."
        confirmLabel="Regenerate plan"
        onConfirm={regenerate}
        loading={regenerating}
      />
    </div>
  );
}
