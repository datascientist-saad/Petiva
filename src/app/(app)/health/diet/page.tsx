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
import {
  calculateBirdNutrition,
  type BirdNutritionResult,
} from "@/lib/nutrition/bird-calculator";
import { speciesUsesBirdNutrition } from "@/lib/species/registry";
import { DietPlanService } from "@/services/diet-plan-service";
import type { DietPlan, Pet } from "@/types/database";

function isBirdNutritionResult(result: unknown): result is BirdNutritionResult {
  return Boolean(result && typeof result === "object" && "suggestedPelletPercent" in result);
}

function isBirdPlan(plan: DietPlan, pet: Pet): boolean {
  return (
    plan.engine_type === "bird" ||
    speciesUsesBirdNutrition(pet.species) ||
    isBirdNutritionResult(plan.result)
  );
}

function MammalDietView({
  plan,
  result,
  completions,
  selectedPet,
  vetNotes,
  setVetNotes,
  vetApproved,
  setVetApproved,
  onToggleMeal,
  onRegenerateOpen,
}: {
  plan: DietPlan;
  result: DietCalculationResult;
  completions: Array<{ meal_index: number }>;
  selectedPet: Pet;
  vetNotes: string;
  setVetNotes: (v: string) => void;
  vetApproved: boolean;
  setVetApproved: (v: boolean) => void;
  onToggleMeal: (mealIndex: number, scheduledTime?: string) => void;
  onRegenerateOpen: () => void;
}) {
  const mealSchedule = result.mealSchedule ?? [];
  const mealsDone = completions.length;
  const totalMeals = mealSchedule.length;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Diet plan"
        description={`Personalized nutrition for ${selectedPet.name}`}
        action={
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onRegenerateOpen}>
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Salad className="size-4 text-primary" />
            Today&apos;s feeding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {mealsDone} of {totalMeals} meals completed
          </p>
          {mealSchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meal schedule on this plan yet.</p>
          ) : (
            mealSchedule.map((meal) => {
              const done = completions.some((c) => c.meal_index === meal.mealIndex);
              return (
                <label
                  key={meal.mealIndex}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 p-3"
                >
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => onToggleMeal(meal.mealIndex, meal.time)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {meal.label} · {meal.time}
                    </p>
                    <p className="text-xs text-muted-foreground">{meal.calories} kcal target</p>
                  </div>
                </label>
              );
            })
          )}
        </CardContent>
      </Card>

      {(result.dryFoodGrams || result.wetFoodGrams) && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Mixed feeding breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            {result.dryFoodGrams ? (
              <p>
                Dry: {result.dryFoodGrams}g/day ({result.perMealDryGrams}g/meal)
              </p>
            ) : null}
            {result.wetFoodGrams ? (
              <p>
                Wet: {result.wetFoodGrams}g/day ({result.perMealWetGrams}g/meal)
              </p>
            ) : null}
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
            <p key={w} className="text-warning">
              ⚠️ {w}
            </p>
          ))}
          <p className="text-xs">
            Generated {new Date(plan.generated_at).toLocaleDateString()} · Review by{" "}
            {plan.review_by ?? "—"}
          </p>
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

      <Button asChild variant="outline" className="rounded-xl">
        <Link href={`/pets/${selectedPet.id}`}>Update pet profile</Link>
      </Button>
    </div>
  );
}

function BirdDietView({
  plan,
  result,
  selectedPet,
  onRegenerateOpen,
}: {
  plan: DietPlan;
  result: BirdNutritionResult;
  selectedPet: Pet;
  onRegenerateOpen: () => void;
}) {
  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Diet plan"
        description={`Avian nutrition guidance for ${selectedPet.name}`}
        action={
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onRegenerateOpen}>
            <RefreshCw className="mr-2 size-4" />
            Regenerate
          </Button>
        }
      />

      {result.elevatedVetWarning ? (
        <AlertBanner variant="warning" title="Avian veterinarian review recommended">
          {result.avianVetDisclaimer}
        </AlertBanner>
      ) : (
        <AlertBanner title="Educational guidance">{result.avianVetDisclaimer}</AlertBanner>
      )}

      {result.isGeneralGuidance ? (
        <AlertBanner variant="warning" title="General guidance">
          Reference data for this species is limited. Confirm all portions with an avian veterinarian.
        </AlertBanner>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Pellets"
          value={`${result.suggestedPelletPercent.min}–${result.suggestedPelletPercent.max}%`}
          hint="of daily diet"
        />
        <MetricCard label="Seeds max" value={`≤${result.suggestedSeedPercentMax}%`} />
        <MetricCard label="Greens min" value={`≥${result.suggestedVegetablePercentMin}%`} />
        <MetricCard label="Fruit max" value={`≤${result.suggestedFruitPercentMax}%`} />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Feeding schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {result.feedingSchedule.map((item) => (
            <div key={item.label} className="rounded-xl bg-secondary/40 p-3">
              <p className="font-medium">{item.label}</p>
              <p className="text-muted-foreground">{item.detail}</p>
            </div>
          ))}
          <p className="text-muted-foreground">{result.waterSchedule}</p>
          <p className="text-muted-foreground">{result.treatGuidance}</p>
        </CardContent>
      </Card>

      {result.personalBaselineGrams != null ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Weight monitoring</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Personal baseline: {result.personalBaselineGrams} g · Check every{" "}
            {result.weightMonitoringFrequencyDays} day(s)
          </CardContent>
        </Card>
      ) : null}

      {result.unsafeFoodWarnings.length > 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Foods to avoid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {result.unsafeFoodWarnings.map((w) => (
              <p key={w}>• {w}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {result.enrichmentTips.length > 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Enrichment feeding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {result.enrichmentTips.map((tip) => (
              <p key={tip}>• {tip}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Plan notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {result.influencingFactors.map((f) => (
            <p key={f}>• {f}</p>
          ))}
          {result.limitations.map((l) => (
            <p key={l} className="text-warning">
              ⚠️ {l}
            </p>
          ))}
          <p className="text-xs">
            Generated {new Date(plan.generated_at).toLocaleDateString()} · Review by{" "}
            {plan.review_by ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="rounded-xl">
        <Link href={`/pets/${selectedPet.id}`}>Update pet profile</Link>
      </Button>
    </div>
  );
}

export default function DietPlanPage() {
  const { selectedPet, selectedPetId, loading: petsLoading } = usePet();
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

  async function regenerate() {
    if (!selectedPet || !selectedPetId) return;
    setRegenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const service = new DietPlanService(supabase);

      if (speciesUsesBirdNutrition(selectedPet.species)) {
        const birdInput = service.buildBirdInputFromPet(selectedPet);
        if (!birdInput) {
          throw new Error("Add weight and bird profile details on your pet profile first.");
        }
        const birdResult = calculateBirdNutrition(birdInput);
        await service.saveBirdPlan(selectedPetId, user.id, birdInput, birdResult, {
          ownerNotes: vetNotes,
        });
      } else {
        const input = service.buildInputFromPet(selectedPet);
        if (!input) {
          throw new Error("Add weight, diet goal, and food details on your pet profile first.");
        }
        await service.savePlan(selectedPetId, user.id, input, {
          vetNotes,
          vetApproved,
          replace: true,
        });
      }

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

  if (petsLoading) {
    return <LoadingState message="Loading your pets…" />;
  }

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view their diet plan." />;
  }

  if (loading) return <LoadingState message={`Loading ${selectedPet.name}'s diet plan…`} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const mammalResult = plan?.result as unknown as DietCalculationResult | undefined;
  const birdResult = isBirdNutritionResult(plan?.result) ? plan.result : null;
  const hasRenderablePlan =
    plan && (isBirdPlan(plan, selectedPet) ? birdResult != null : mammalResult?.mealSchedule != null || mammalResult?.merKcalMin != null);

  if (!hasRenderablePlan) {
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

  return (
    <>
      {plan && birdResult && isBirdPlan(plan, selectedPet) ? (
        <BirdDietView
          plan={plan}
          result={birdResult}
          selectedPet={selectedPet}
          onRegenerateOpen={() => setConfirmOpen(true)}
        />
      ) : plan && mammalResult ? (
        <MammalDietView
          plan={plan}
          result={mammalResult}
          completions={completions}
          selectedPet={selectedPet}
          vetNotes={vetNotes}
          setVetNotes={setVetNotes}
          vetApproved={vetApproved}
          setVetApproved={setVetApproved}
          onToggleMeal={(mealIndex, scheduledTime) => void toggleMeal(mealIndex, scheduledTime)}
          onRegenerateOpen={() => setConfirmOpen(true)}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replace current diet plan?"
        description="We'll save a new version and archive the previous plan."
        confirmLabel="Regenerate plan"
        onConfirm={regenerate}
        loading={regenerating}
      />
    </>
  );
}
