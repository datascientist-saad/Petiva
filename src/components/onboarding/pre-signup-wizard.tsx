"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertBanner } from "@/components/shared/alert-banner";
import { SegmentedSelector } from "@/components/shared/segmented-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brand } from "@/lib/brand";
import { breedsForSpecies } from "@/lib/breeds";
import { calculatePetAge, speciesEmoji } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { validateMixedFeedingPercent } from "@/lib/diet-calculations";
import {
  buildDietPreviewFromDraft,
  loadOnboardingDraft,
  resetOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/onboarding-draft";
import {
  HEALTH_CONDITION_OPTIONS,
  initialOnboardingDraft,
  type OnboardingDraftData,
} from "@/types/onboarding-draft";

const STEPS = ["Welcome", "Pet basics", "Body & lifestyle", "Diet", "Preview"];
const TOTAL_STEPS = 5;

export function PreSignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingDraftData>(initialOnboardingDraft);

  useEffect(() => {
    const saved = loadOnboardingDraft();
    if (saved) {
      setData(saved);
      setStep(saved.stepIndex ?? 0);
    }
  }, []);

  const persist = useCallback((next: OnboardingDraftData, nextStep: number) => {
    const draft = {
      ...next,
      stepIndex: nextStep,
      step: STEPS[nextStep].toLowerCase().replace(/ & /g, "_").replace(/ /g, "_") as OnboardingDraftData["step"],
    };
    setData(draft);
    saveOnboardingDraft(draft);
  }, []);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const breeds = breedsForSpecies(data.species);
  const preview = useMemo(() => buildDietPreviewFromDraft(data), [data]);

  const summaryAge = calculatePetAge({
    birth_date: data.use_approximate_age ? null : data.birth_date || null,
    estimated_age_months: data.use_approximate_age
      ? Number(data.estimated_age_years || 0) * 12 + Number(data.estimated_age_months || 0)
      : null,
  });

  function update(patch: Partial<OnboardingDraftData>) {
    persist({ ...data, ...patch }, step);
  }

  function validateStep(): boolean {
    if (step === 1) {
      if (!data.name.trim()) {
        toast.error("What's your pet's name?");
        return false;
      }
    }
    if (step === 2) {
      if (!data.weight_value || Number(data.weight_value) <= 0) {
        toast.error("Please enter your pet's weight.");
        return false;
      }
      if (!data.activity_level) {
        toast.error("Select an activity level.");
        return false;
      }
      if (!data.body_condition) {
        toast.error("Select a body condition.");
        return false;
      }
    }
    if (step === 3) {
      if (!data.food_type) {
        toast.error("Select a food type.");
        return false;
      }
      if (!data.diet_goal) {
        toast.error("Select a diet goal.");
        return false;
      }
      if (data.food_type === "mixed") {
        const dry = Number(data.mixed_dry_percent) || 0;
        const wet = 100 - dry;
        if (!validateMixedFeedingPercent(dry, wet)) {
          toast.error("Dry and wet percentages must add up to 100%.");
          return false;
        }
      }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    const nextStep = Math.min(step + 1, TOTAL_STEPS - 1);
    if (nextStep === TOTAL_STEPS - 1) {
      const dietPreview = buildDietPreviewFromDraft(data);
      persist({ ...data, diet_preview: dietPreview }, nextStep);
    } else {
      persist(data, nextStep);
    }
    setStep(nextStep);
  }

  function back() {
    const prev = Math.max(step - 1, 0);
    persist(data, prev);
    setStep(prev);
  }

  function restart() {
    const fresh = resetOnboardingDraft();
    setData(fresh);
    setStep(0);
    toast.message("Onboarding restarted.");
  }

  function goToSignup() {
    saveOnboardingDraft({ ...data, diet_preview: preview, stepIndex: step });
    router.push("/signup");
  }

  const showStickyNav = step > 0 && step < TOTAL_STEPS - 1;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col animate-fade-up px-3 sm:px-4",
        step === 0 ? "justify-center py-6 sm:py-8" : "py-4 sm:py-6",
        showStickyNav && "pb-24",
      )}
    >
      {step > 0 ? (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {TOTAL_STEPS} · {STEPS[step]}
            </span>
            <Button variant="ghost" size="sm" onClick={restart} className="h-auto shrink-0 rounded-full px-2 py-1 text-xs">
              Start over
            </Button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      ) : null}

      {step === 0 && (
        <Card className="rounded-3xl border-border/70 shadow-md">
          <CardHeader className="space-y-4 px-5 pt-6 text-center sm:px-8 sm:pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
              🐾
            </div>
            <CardTitle className="font-display text-2xl leading-tight sm:text-3xl">
              Better care starts with knowing your pet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-5 pb-6 text-center sm:px-8 sm:pb-8">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {brand.tagline} Build a personalized diet plan and keep vaccinations, meals, and health records in one
              place.
            </p>
            <ul className="space-y-2.5 rounded-2xl bg-secondary/50 p-4 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5 text-primary">✓</span>
                <span>Personalized diet plan in under 5 minutes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5 text-primary">✓</span>
                <span>Track meals, meds, and vet visits</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5 text-primary">✓</span>
                <span>AI guidance tailored to your pet</span>
              </li>
            </ul>
            <div className="space-y-3">
              <Button onClick={next} className="h-12 w-full rounded-2xl text-base" size="lg">
                Create my pet&apos;s plan
              </Button>
              <Button asChild variant="outline" className="h-12 w-full rounded-2xl text-base">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Free to start · No credit card required</p>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="rounded-2xl">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Tell us about your pet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-2">
              <Label htmlFor="pet-name">Pet name *</Label>
              <Input id="pet-name" value={data.name} onChange={(e) => update({ name: e.target.value })} className="rounded-xl" placeholder="Luna" />
            </div>
            <div className="space-y-2">
              <Label>Pet type</Label>
              <SegmentedSelector
                value={data.species}
                onChange={(v) => update({ species: v, breed: "" })}
                options={[
                  { value: "cat", label: "🐱 Cat" },
                  { value: "dog", label: "🐶 Dog" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Breed</Label>
              <Select value={data.breed} onValueChange={(v) => update({ breed: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Search or select breed" /></SelectTrigger>
                <SelectContent>
                  {breeds.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={data.use_approximate_age} onCheckedChange={(c) => update({ use_approximate_age: !!c })} id="approx-age" />
              <Label htmlFor="approx-age">I don&apos;t know the exact date of birth</Label>
            </div>
            {!data.use_approximate_age ? (
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input type="date" value={data.birth_date} onChange={(e) => update({ birth_date: e.target.value })} className="rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Approx. years</Label>
                  <Input type="number" min={0} value={data.estimated_age_years} onChange={(e) => update({ estimated_age_years: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Approx. months</Label>
                  <Input type="number" min={0} max={11} value={data.estimated_age_months} onChange={(e) => update({ estimated_age_months: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Sex</Label>
              <SegmentedSelector
                value={data.sex}
                onChange={(v) => update({ sex: v })}
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-2xl">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Body & lifestyle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Weight *</Label>
                <Input type="number" step="0.1" value={data.weight_value} onChange={(e) => update({ weight_value: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <SegmentedSelector
                  value={data.weight_unit}
                  onChange={(v) => update({ weight_unit: v })}
                  options={[
                    { value: "kg", label: "kg" },
                    { value: "lb", label: "lb" },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Activity level *</Label>
              <SegmentedSelector
                value={data.activity_level}
                onChange={(v) => update({ activity_level: v })}
                columns={2}
                options={[
                  { value: "low", label: "Low", description: "Mostly resting, short walks" },
                  { value: "moderate", label: "Moderate", description: "Regular walks or play" },
                  { value: "active", label: "Active", description: "Daily exercise" },
                  { value: "very_active", label: "Very active", description: "Working or sport dog" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Body condition *</Label>
              <SegmentedSelector
                value={data.body_condition}
                onChange={(v) => update({ body_condition: v })}
                columns={2}
                options={[
                  { value: "underweight", label: "Underweight", description: "Ribs very visible" },
                  { value: "ideal", label: "Ideal", description: "Ribs easy to feel" },
                  { value: "overweight", label: "Overweight", description: "Ribs hard to feel" },
                  { value: "unsure", label: "Not sure", description: "We can refine later" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Neutered / spayed</Label>
              <SegmentedSelector
                value={data.neutered}
                onChange={(v) => update({ neutered: v })}
                columns={3}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-2xl">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Diet information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-2">
              <Label>Current food type *</Label>
              <SegmentedSelector
                value={data.food_type}
                onChange={(v) => update({ food_type: v })}
                columns={2}
                options={[
                  { value: "dry", label: "Dry food" },
                  { value: "wet", label: "Wet food" },
                  { value: "mixed", label: "Mixed feeding" },
                  { value: "home_cooked", label: "Home-cooked" },
                ]}
              />
            </div>
            {data.food_type === "mixed" ? (
              <div className="space-y-2">
                <Label>Dry food percentage</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={data.mixed_dry_percent}
                  onChange={(e) => update({ mixed_dry_percent: e.target.value })}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Wet: {100 - (Number(data.mixed_dry_percent) || 0)}%</p>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Meals per day</Label>
                <Input type="number" min={1} max={6} value={data.meals_per_day} onChange={(e) => update({ meals_per_day: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Diet goal *</Label>
                <Select value={data.diet_goal} onValueChange={(v) => update({ diet_goal: v as OnboardingDraftData["diet_goal"] })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintain">Maintain weight</SelectItem>
                    <SelectItem value="lose">Lose weight</SelectItem>
                    <SelectItem value="gain">Gain weight</SelectItem>
                    <SelectItem value="improve">Improve nutrition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Food brand (optional)</Label>
                <Input value={data.food_brand} onChange={(e) => update({ food_brand: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Product (optional)</Label>
                <Input value={data.food_product} onChange={(e) => update({ food_product: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Calories per 100g (optional)</Label>
                <Input type="number" value={data.calories_per_100g} onChange={(e) => update({ calories_per_100g: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Calories per serving (optional)</Label>
                <Input type="number" value={data.calories_per_serving} onChange={(e) => update({ calories_per_serving: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Known allergies</Label>
              <Input value={data.allergies} onChange={(e) => update({ allergies: e.target.value })} placeholder="Chicken, beef (comma-separated)" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Foods to avoid</Label>
              <Input value={data.foods_to_avoid} onChange={(e) => update({ foods_to_avoid: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Health conditions</Label>
              <div className="grid grid-cols-2 gap-2">
                {HEALTH_CONDITION_OPTIONS.map((condition) => (
                  <label key={condition} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={data.health_conditions.includes(condition)}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...data.health_conditions, condition]
                          : data.health_conditions.filter((c) => c !== condition);
                        update({ health_conditions: next });
                      }}
                    />
                    {condition}
                  </label>
                ))}
              </div>
              <Textarea
                value={data.other_condition}
                onChange={(e) => update({ other_condition: e.target.value })}
                placeholder="Other conditions (optional)"
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="rounded-2xl border-primary/20 shadow-md">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display flex items-center gap-2 text-xl sm:text-2xl">
              {speciesEmoji(data.species)} {data.name}&apos;s plan preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <ul className="space-y-2 rounded-2xl bg-secondary/40 p-4 text-sm">
              <li>{data.breed || "Breed not specified"}</li>
              {summaryAge.label ? <li>{summaryAge.label} old</li> : null}
              {data.weight_value ? <li>{data.weight_value} {data.weight_unit}</li> : null}
            </ul>

            {preview ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Daily calories</p>
                  <p className="font-display text-xl font-semibold">{preview.merKcalMin}–{preview.merKcalMax} kcal</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Meals per day</p>
                  <p className="font-display text-xl font-semibold">{preview.recommendedMealsPerDay}</p>
                </div>
              </div>
            ) : null}

            {preview?.mealSchedule?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Example feeding schedule</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {preview.mealSchedule.map((meal) => (
                    <li key={meal.mealIndex}>{meal.time} — {meal.calories} kcal</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="relative overflow-hidden rounded-2xl border border-dashed p-4">
              <p className="text-sm font-medium">Full plan includes</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground blur-[2px]">
                <li>Detailed portion breakdown</li>
                <li>Dry/wet food quantities</li>
                <li>Feeding reminders</li>
                <li>Future weight-based adjustments</li>
              </ul>
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <p className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">🔒 Save to unlock</p>
              </div>
            </div>

            <AlertBanner variant={preview?.elevatedVetWarning ? "warning" : "info"}>
              {preview?.safetyNotice ?? "This plan is an estimate for general guidance."}
            </AlertBanner>

            <Button onClick={goToSignup} className="w-full rounded-2xl" size="lg">
              Create a free account to save the full plan
            </Button>
          </CardContent>
        </Card>
      )}

      {showStickyNav ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg gap-3">
            <Button variant="outline" onClick={back} className="flex-1 rounded-xl">
              Back
            </Button>
            <Button onClick={next} className="flex-1 rounded-xl">
              Continue
            </Button>
          </div>
        </div>
      ) : step === TOTAL_STEPS - 1 ? (
        <div className="mt-4 flex justify-start">
          <Button variant="outline" onClick={back} className="rounded-xl">
            Back
          </Button>
        </div>
      ) : null}
    </div>
  );
}
