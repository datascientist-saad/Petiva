"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertBanner } from "@/components/shared/alert-banner";
import { SegmentedSelector } from "@/components/shared/segmented-selector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { SUPPORTED_SPECIES } from "@/lib/species/registry";
import { BIRD_SPECIES_OPTIONS } from "@/lib/species/bird-breeds";
import { brand } from "@/lib/brand";
import { breedsForSpecies } from "@/lib/breeds";
import { calculatePetAge, speciesEmoji } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  activityOptions,
  birthDateBounds,
  fieldErrorId,
  lifeStageOptions,
  validateOnboardingStep,
  type OnboardingFieldErrors,
} from "@/lib/onboarding-validation";
import {
  buildDietPreviewFromDraft,
  draftHasMeaningfulData,
  loadOnboardingDraft,
  resetOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/onboarding-draft";
import { createPetFromOnboardingDraft } from "@/lib/onboarding-transfer";
import { uploadPetPhoto } from "@/lib/pet-photo";
import { AnalyticsService } from "@/services/notification-service";
import {
  HEALTH_CONDITION_OPTIONS,
  initialOnboardingDraft,
  type OnboardingDraftData,
} from "@/types/onboarding-draft";
import { PetPhotoPicker } from "@/components/pets/pet-photo-field";

const STEPS = ["Pet basics", "Body and lifestyle", "Diet and health", "Plan preview"] as const;
const STEP_KEYS: OnboardingDraftData["step"][] = ["basics", "body", "diet", "preview"];
const TOTAL_STEPS = 4;

export type OnboardingWizardMode = "pre-signup" | "authenticated";

interface PreSignupWizardProps {
  mode?: OnboardingWizardMode;
  onPetSaved?: (petId: string) => Promise<void>;
}

function withStepMeta(next: OnboardingDraftData, nextStep: number): OnboardingDraftData {
  return {
    ...next,
    stepIndex: nextStep,
    step: STEP_KEYS[nextStep] ?? "basics",
    updatedAt: new Date().toISOString(),
  };
}

function focusField(id: string) {
  const node = document.getElementById(id);
  if (node instanceof HTMLElement) {
    node.focus();
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

export function PreSignupWizard({ mode = "pre-signup", onPetSaved }: PreSignupWizardProps) {
  const router = useRouter();
  const isAuthenticatedFlow = mode === "authenticated";
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingDraftData>(initialOnboardingDraft);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<OnboardingFieldErrors>({});
  const [restartOpen, setRestartOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticatedFlow) {
      setData(initialOnboardingDraft());
      setPhotoFile(null);
      setStep(0);
      return;
    }
    const saved = loadOnboardingDraft();
    if (saved) {
      setData(saved);
      setStep(Math.min(Math.max(saved.stepIndex ?? 0, 0), TOTAL_STEPS - 1));
    }
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent(AnalyticsEvents.ONBOARDING_STARTED, { source: "get-started" });
    }
  }, [isAuthenticatedFlow]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const breeds = breedsForSpecies(data.species);
  const preview = useMemo(() => buildDietPreviewFromDraft(data), [data]);
  const dateBounds = birthDateBounds(data.species);
  const summaryAge = calculatePetAge({
    birth_date: data.use_approximate_age ? null : data.birth_date || null,
    estimated_age_months: data.use_approximate_age
      ? Number(data.estimated_age_years || 0) * 12 + Number(data.estimated_age_months || 0) || null
      : null,
    life_stage: data.life_stage || (data.use_approximate_age ? "unknown" : null),
    species: data.species,
  });

  function update(patch: Partial<OnboardingDraftData>) {
    setData((current) => {
      const draft = withStepMeta({ ...current, ...patch }, step);
      if (!isAuthenticatedFlow) saveOnboardingDraft(draft);
      return draft;
    });
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  }

  function persistDraft(nextData: OnboardingDraftData, nextStep: number) {
    const draft = withStepMeta(nextData, nextStep);
    if (!isAuthenticatedFlow) saveOnboardingDraft(draft);
    return draft;
  }

  function next() {
    const result = validateOnboardingStep(data, step);
    if (!result.ok) {
      setErrors(result.errors);
      setStatusMessage("Please correct the highlighted fields.");
      if (result.firstInvalidId) focusField(result.firstInvalidId);
      trackEvent(AnalyticsEvents.ONBOARDING_VALIDATION_FAILED, { step: STEP_KEYS[step] });
      return;
    }
    setErrors({});
    setStatusMessage("");
    const nextStep = Math.min(step + 1, TOTAL_STEPS - 1);
    const nextData =
      nextStep === TOTAL_STEPS - 1
        ? { ...data, diet_preview: buildDietPreviewFromDraft(data) }
        : data;
    setData(persistDraft(nextData, nextStep));
    setStep(nextStep);
    trackEvent(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: STEP_KEYS[step] });
    if (nextStep === TOTAL_STEPS - 1) {
      trackEvent(AnalyticsEvents.PREVIEW_REACHED, { species: data.species });
      const previewResult = buildDietPreviewFromDraft(data);
      if (previewResult && "elevatedVetWarning" in previewResult && previewResult.elevatedVetWarning) {
        trackEvent(AnalyticsEvents.NUTRITION_ESCALATION_DISPLAYED, { species: data.species });
      }
    }
  }

  function back() {
    const prev = Math.max(step - 1, 0);
    setData((current) => persistDraft(current, prev));
    setStep(prev);
    setErrors({});
  }

  function confirmRestart() {
    if (draftHasMeaningfulData(data)) {
      setRestartOpen(true);
      return;
    }
    restart();
  }

  function restart() {
    const fresh = initialOnboardingDraft();
    if (!isAuthenticatedFlow) resetOnboardingDraft();
    setData(fresh);
    setPhotoFile(null);
    setStep(0);
    setErrors({});
    setRestartOpen(false);
    trackEvent(AnalyticsEvents.ONBOARDING_ABANDONED, { step: STEP_KEYS[step] });
    toast.message(isAuthenticatedFlow ? "Form cleared." : "Onboarding restarted.");
  }

  async function saveAuthenticatedPet() {
    setSaving(true);
    setStatusMessage("Saving your pet’s plan…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to continue.");

      const draft = withStepMeta({ ...data, diet_preview: buildDietPreviewFromDraft(data) }, step);
      const { petId, petName } = await createPetFromOnboardingDraft(supabase, user, draft);

      if (photoFile) {
        try {
          const url = await uploadPetPhoto(supabase, user.id, petId, photoFile);
          const { PetService } = await import("@/services/pet-service");
          await new PetService(supabase).update(petId, { profile_image_url: url });
        } catch (photoErr) {
          console.warn("[Animivo:onboarding] Photo upload failed", photoErr);
          toast.message(`${petName} was saved — you can add a photo from their profile.`);
        }
      }

      const analytics = new AnalyticsService(supabase);
      await analytics.track(AnalyticsEvents.PET_SAVED, user.id, petId, {
        species: draft.species,
        source: "authenticated_onboarding",
      });

      localStorage.setItem("animivo_selected_pet", petId);
      await onPetSaved?.(petId);
      setStatusMessage("Pet saved.");
      toast.success(`${petName} is ready!`);
      router.replace("/home");
    } catch (err) {
      setStatusMessage("");
      toast.error(toUserMessage(err, "Could not save your pet profile."));
    } finally {
      setSaving(false);
    }
  }

  function goToSignup() {
    const draft = persistDraft({ ...data, diet_preview: buildDietPreviewFromDraft(data) }, step);
    setData(draft);
    setSaving(true);
    setStatusMessage("Taking you to create a free account…");
    trackEvent(AnalyticsEvents.SIGNUP_STARTED, { source: "preview" });
    router.push("/signup?next=/setup/complete");
  }

  const showStickyNav = step < TOTAL_STEPS - 1;
  const mammal = data.species !== "bird";

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col animate-fade-up px-3 sm:px-4",
        "py-4 sm:py-6",
        showStickyNav && "pb-28"
      )}
    >
      {isAuthenticatedFlow ? (
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Add a pet</p>
          <h1 className="font-display text-xl font-semibold">{brand.name}</h1>
        </div>
      ) : null}

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span aria-live="polite">
            Step {step + 1} of {TOTAL_STEPS} · {STEPS[step]}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={confirmRestart}
            className="min-h-11 shrink-0 rounded-full px-3"
          >
            Start over
          </Button>
        </div>
        <Progress value={progress} className="h-1.5" aria-hidden />
      </div>
      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>

      {step === 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Tell us about your pet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <PetPhotoPicker
              name={data.name}
              species={data.species}
              file={photoFile}
              onFileChange={setPhotoFile}
            />
            <div className="space-y-2">
              <Label htmlFor="name">Pet name</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => update({ name: e.target.value })}
                className="min-h-11 rounded-xl"
                placeholder="Luna"
                aria-describedby={errors.name ? fieldErrorId("name") : undefined}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p id={fieldErrorId("name")} className="text-sm text-destructive" role="alert">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Pet type</legend>
              <SegmentedSelector
                id="species"
                ariaLabel="Pet type"
                value={data.species}
                onChange={(v) => {
                  const nextSpecies = v as OnboardingDraftData["species"];
                  const crossingBird =
                    nextSpecies === "bird" || data.species === "bird";
                  update({
                    species: nextSpecies,
                    breed: "",
                    weight_unit: nextSpecies === "bird" ? "g" : data.weight_unit === "g" ? "kg" : data.weight_unit,
                    weight_value: crossingBird && nextSpecies !== data.species ? "" : data.weight_value,
                    species_profile: {
                      ...initialOnboardingDraft().species_profile,
                      ...(data.species_profile ?? {}),
                    },
                  });
                }}
                options={SUPPORTED_SPECIES.map((s) => ({
                  value: s.id,
                  label: `${s.icon} ${s.displayName}`,
                }))}
              />
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="breed">
                {data.species === "bird" ? "Bird species" : "Breed"}{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Select
                value={
                  (data.species === "bird" ? data.species_profile?.bird_species : data.breed) || undefined
                }
                onValueChange={(v) =>
                  data.species === "bird"
                    ? update({
                        species_profile: {
                          ...initialOnboardingDraft().species_profile,
                          ...(data.species_profile ?? {}),
                          bird_species: v,
                        },
                        breed: v,
                      })
                    : update({ breed: v })
                }
              >
                <SelectTrigger id="breed" className="min-h-11 rounded-xl">
                  <SelectValue placeholder="Search or select" />
                </SelectTrigger>
                <SelectContent>
                  {(data.species === "bird" ? BIRD_SPECIES_OPTIONS : breeds).map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-h-11 items-center gap-2">
              <Checkbox
                checked={data.use_approximate_age}
                onCheckedChange={(c) =>
                  update({
                    use_approximate_age: !!c,
                    birth_date: c ? "" : data.birth_date,
                    life_stage: c ? data.life_stage || "" : "",
                  })
                }
                id="approx-age"
              />
              <Label htmlFor="approx-age">I don&apos;t know the exact date of birth</Label>
            </div>
            {!data.use_approximate_age ? (
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date of birth</Label>
                <Input
                  id="birth_date"
                  type="date"
                  min={dateBounds.min}
                  max={dateBounds.max}
                  value={data.birth_date}
                  onChange={(e) => update({ birth_date: e.target.value })}
                  className="min-h-11 rounded-xl"
                  aria-describedby={errors.birth_date ? fieldErrorId("birth_date") : undefined}
                  aria-invalid={Boolean(errors.birth_date)}
                />
                {errors.birth_date ? (
                  <p id={fieldErrorId("birth_date")} className="text-sm text-destructive" role="alert">
                    {errors.birth_date}
                  </p>
                ) : null}
              </div>
            ) : (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Approximate life stage</legend>
                <SegmentedSelector
                  id="life_stage"
                  ariaLabel="Approximate life stage"
                  value={data.life_stage}
                  onChange={(v) => update({ life_stage: v as OnboardingDraftData["life_stage"] })}
                  options={lifeStageOptions(data.species)}
                />
                {errors.life_stage ? (
                  <p id={fieldErrorId("life_stage")} className="text-sm text-destructive" role="alert">
                    {errors.life_stage}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    We will not invent a birth date. If you choose Not sure, we assume adult only when it is
                    safe and show that assumption.
                  </p>
                )}
              </fieldset>
            )}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Sex <span className="font-normal text-muted-foreground">(optional)</span>
              </legend>
              <SegmentedSelector
                id="sex"
                ariaLabel="Sex"
                value={data.sex}
                onChange={(v) => update({ sex: v })}
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                  { value: "unknown", label: "Not sure" },
                ]}
              />
            </fieldset>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="rounded-2xl">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Body and lifestyle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <div className={cn("grid gap-3", mammal ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
              <div className="space-y-2">
                <Label htmlFor="weight_value">
                  {data.species === "bird" ? "Weight (grams)" : "Weight"}
                </Label>
                <Input
                  id="weight_value"
                  type="number"
                  inputMode="decimal"
                  min={data.species === "bird" ? 5 : 0.1}
                  max={data.species === "bird" ? 3000 : 120}
                  step={data.species === "bird" ? "1" : "0.1"}
                  value={data.weight_value}
                  onChange={(e) => update({ weight_value: e.target.value })}
                  className="min-h-11 rounded-xl"
                  aria-describedby={errors.weight_value ? fieldErrorId("weight_value") : undefined}
                  aria-invalid={Boolean(errors.weight_value)}
                />
                {errors.weight_value ? (
                  <p id={fieldErrorId("weight_value")} className="text-sm text-destructive" role="alert">
                    {errors.weight_value}
                  </p>
                ) : null}
              </div>
              {mammal ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Unit</legend>
                  <SegmentedSelector
                    id="weight_unit"
                    ariaLabel="Weight unit"
                    value={data.weight_unit}
                    onChange={(v) => update({ weight_unit: v })}
                    options={[
                      { value: "kg", label: "kg" },
                      { value: "lb", label: "lb" },
                    ]}
                  />
                </fieldset>
              ) : null}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Activity level</legend>
              <SegmentedSelector
                id="activity_level"
                ariaLabel="Activity level"
                value={data.activity_level}
                onChange={(v) => update({ activity_level: v })}
                columns={2}
                options={activityOptions(data.species)}
              />
              {errors.activity_level ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.activity_level}
                </p>
              ) : null}
            </fieldset>
            {mammal ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Body condition</legend>
                  <SegmentedSelector
                    id="body_condition"
                    ariaLabel="Body condition"
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
                  {errors.body_condition ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.body_condition}
                    </p>
                  ) : null}
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Neutered / spayed{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </legend>
                  <SegmentedSelector
                    id="neutered"
                    ariaLabel="Neutered or spayed"
                    value={data.neutered}
                    onChange={(v) => update({ neutered: v })}
                    columns={3}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unknown", label: "Not sure" },
                    ]}
                  />
                </fieldset>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-2xl">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Diet and health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            {data.species === "bird" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Tell us the current food pattern so we can organize tracking. A personalized calorie
                  or feeding-quantity calculation is not yet available for birds.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pellet_percent">Pellets %</Label>
                    <Input
                      id="pellet_percent"
                      type="number"
                      min={0}
                      max={100}
                      value={data.species_profile?.pellet_percent ?? ""}
                      onChange={(e) =>
                        update({
                          species_profile: {
                            ...initialOnboardingDraft().species_profile,
                            ...(data.species_profile ?? {}),
                            pellet_percent: e.target.value,
                          },
                        })
                      }
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seed_percent">
                      Seeds % <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="seed_percent"
                      type="number"
                      min={0}
                      max={100}
                      value={data.species_profile?.seed_percent ?? ""}
                      onChange={(e) =>
                        update({
                          species_profile: {
                            ...initialOnboardingDraft().species_profile,
                            ...(data.species_profile ?? {}),
                            seed_percent: e.target.value,
                          },
                        })
                      }
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vegetable_percent">Vegetables / greens %</Label>
                    <Input
                      id="vegetable_percent"
                      type="number"
                      min={0}
                      max={100}
                      value={data.species_profile?.vegetable_percent ?? ""}
                      onChange={(e) =>
                        update({
                          species_profile: {
                            ...initialOnboardingDraft().species_profile,
                            ...(data.species_profile ?? {}),
                            vegetable_percent: e.target.value,
                          },
                        })
                      }
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fruit_percent">
                      Fruit % <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="fruit_percent"
                      type="number"
                      min={0}
                      max={100}
                      value={data.species_profile?.fruit_percent ?? ""}
                      onChange={(e) =>
                        update({
                          species_profile: {
                            ...initialOnboardingDraft().species_profile,
                            ...(data.species_profile ?? {}),
                            fruit_percent: e.target.value,
                          },
                        })
                      }
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                </div>
                {errors.pellet_percent ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.pellet_percent}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="primary_goal">
                    Primary care goal <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="primary_goal"
                    value={data.primary_goal}
                    onChange={(e) => update({ primary_goal: e.target.value })}
                    placeholder="e.g. Improve diet balance"
                    className="min-h-11 rounded-xl"
                  />
                </div>
              </>
            ) : (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Current food type</legend>
                  <SegmentedSelector
                    id="food_type"
                    ariaLabel="Current food type"
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
                  {errors.food_type ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.food_type}
                    </p>
                  ) : null}
                </fieldset>
                {data.food_type === "mixed" ? (
                  <div className="space-y-2">
                    <Label htmlFor="mixed_dry_percent">Dry food percentage</Label>
                    <Input
                      id="mixed_dry_percent"
                      type="number"
                      min={0}
                      max={100}
                      value={data.mixed_dry_percent}
                      onChange={(e) => update({ mixed_dry_percent: e.target.value })}
                      className="min-h-11 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Wet: {100 - (Number(data.mixed_dry_percent) || 0)}%
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meals_per_day">
                      Meals per day <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="meals_per_day"
                      type="number"
                      min={1}
                      max={4}
                      value={data.meals_per_day}
                      onChange={(e) => update({ meals_per_day: e.target.value })}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diet_goal">Diet goal</Label>
                    <Select
                      value={data.diet_goal || undefined}
                      onValueChange={(v) => update({ diet_goal: v as OnboardingDraftData["diet_goal"] })}
                    >
                      <SelectTrigger id="diet_goal" className="min-h-11 rounded-xl">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintain">Maintain weight</SelectItem>
                        <SelectItem value="lose">Lose weight</SelectItem>
                        <SelectItem value="gain">Gain weight</SelectItem>
                        <SelectItem value="improve">Improve nutrition</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.diet_goal ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.diet_goal}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="food_brand">
                      Food brand <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="food_brand"
                      value={data.food_brand}
                      onChange={(e) => update({ food_brand: e.target.value })}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="food_product">
                      Product <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="food_product"
                      value={data.food_product}
                      onChange={(e) => update({ food_product: e.target.value })}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calorie_unit">
                    Package calories <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Select
                    value={data.calorie_unit || undefined}
                    onValueChange={(v) => update({ calorie_unit: v as OnboardingDraftData["calorie_unit"] })}
                  >
                    <SelectTrigger id="calorie_unit" className="min-h-11 rounded-xl">
                      <SelectValue placeholder="How is energy listed?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_100g">kcal per 100 g</SelectItem>
                      <SelectItem value="per_cup">kcal per cup</SelectItem>
                      <SelectItem value="per_can">kcal per can</SelectItem>
                      <SelectItem value="per_serving">kcal per serving</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This is usually on the guaranteed analysis or feeding-guide panel. We only convert
                    calories into grams when kcal per 100 g is known.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="calories_per_100g">
                      kcal per 100 g <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="calories_per_100g"
                      type="number"
                      min={1}
                      value={data.calories_per_100g}
                      onChange={(e) => update({ calories_per_100g: e.target.value, calorie_unit: "per_100g" })}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calories_per_serving">
                      kcal per serving <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="calories_per_serving"
                      type="number"
                      min={1}
                      value={data.calories_per_serving}
                      onChange={(e) => update({ calories_per_serving: e.target.value })}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="allergies">
                Known allergies <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="allergies"
                value={data.allergies}
                onChange={(e) => update({ allergies: e.target.value })}
                placeholder="Chicken, beef (comma-separated)"
                className="min-h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foods_to_avoid">
                Foods to avoid <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="foods_to_avoid"
                value={data.foods_to_avoid}
                onChange={(e) => update({ foods_to_avoid: e.target.value })}
                className="min-h-11 rounded-xl"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Health conditions <span className="font-normal text-muted-foreground">(optional)</span>
              </legend>
              <p className="text-xs text-muted-foreground">
                Used only to decide whether a routine estimate is appropriate or a veterinarian should
                review first.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {HEALTH_CONDITION_OPTIONS.map((condition) => (
                  <label key={condition} className="flex min-h-11 items-center gap-2 text-sm">
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
            </fieldset>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-2xl border-primary/20 shadow-md">
          <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-display flex items-center gap-2 text-xl sm:text-2xl">
              <span aria-hidden>{speciesEmoji(data.species)}</span>
              {data.name || "Your pet"}&apos;s plan preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
            <ul className="space-y-2 rounded-2xl bg-secondary/40 p-4 text-sm">
              <li>{data.breed || "Breed not specified"}</li>
              <li>{summaryAge.label}</li>
              {data.weight_value ? (
                <li>
                  {data.weight_value} {data.weight_unit}
                </li>
              ) : null}
            </ul>

            {preview && "recommendationBlocked" in preview && preview.recommendationBlocked ? (
              <AlertBanner variant="warning" title="Veterinary review needed">
                {preview.warnings[0]}
              </AlertBanner>
            ) : preview && "merKcalMin" in preview && !preview.recommendationBlocked ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Daily calories (estimate)</p>
                    <p className="font-display break-words text-xl font-semibold">
                      {preview.merKcalMin}–{preview.merKcalMax} kcal
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Central estimate {preview.merKcal} kcal</p>
                  </div>
                  <div className="rounded-2xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Meals per day</p>
                    <p className="font-display text-xl font-semibold">{preview.recommendedMealsPerDay}</p>
                  </div>
                </div>
                {preview.mealSchedule?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Example feeding schedule</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {preview.mealSchedule.map((meal) => (
                        <li key={meal.mealIndex}>
                          {meal.time} — {meal.calories} kcal
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Per-meal calories add up to the daily estimate
                      ({preview.mealSchedule.reduce((sum, meal) => sum + meal.calories, 0)} kcal).
                    </p>
                  </div>
                ) : null}
                {preview.dailyFoodGrams == null ? (
                  <p className="text-sm text-muted-foreground">
                    Gram or cup portions are not shown because the food&apos;s energy density is unknown.
                    Use the calorie target with the label on your food.
                  </p>
                ) : null}
                {preview.assumptions.length ? (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Assumptions used</p>
                    <ul className="list-disc space-y-1 pl-5">
                      {preview.assumptions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">What influenced this estimate</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {preview.influencingFactors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : preview && "calorieCalculationAvailable" in preview ? (
              <>
                <AlertBanner variant="info" title="Bird calorie calculation is not available yet">
                  {preview.avianVetDisclaimer}
                </AlertBanner>
                <div className="space-y-2 rounded-2xl bg-secondary/40 p-4 text-sm">
                  <p className="font-medium">What you can track now</p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Weight in grams</li>
                    <li>Current food pattern</li>
                    <li>Care tasks and reminders</li>
                    <li>Notes to share with an avian veterinarian</li>
                  </ul>
                </div>
              </>
            ) : null}

            <AlertBanner variant={preview && "elevatedVetWarning" in preview && preview.elevatedVetWarning ? "warning" : "info"}>
              {preview && "safetyNotice" in preview
                ? preview.safetyNotice
                : preview && "avianVetDisclaimer" in preview
                  ? preview.avianVetDisclaimer
                  : "This plan is an estimate and a starting point."}
            </AlertBanner>

            {isAuthenticatedFlow ? (
              <Button
                onClick={() => void saveAuthenticatedPet()}
                disabled={saving}
                className="min-h-12 w-full rounded-2xl"
                size="lg"
              >
                {saving ? "Saving…" : `Save ${data.name || "pet"}'s care plan`}
              </Button>
            ) : (
              <Button
                onClick={goToSignup}
                disabled={saving}
                className="min-h-12 w-full rounded-2xl"
                size="lg"
              >
                {saving ? "Continuing…" : "Create a free account to save the full plan"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {showStickyNav ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg gap-3">
            <Button variant="outline" onClick={back} disabled={step === 0} className="min-h-11 flex-1 rounded-xl">
              Back
            </Button>
            <Button onClick={next} className="min-h-11 flex-1 rounded-xl">
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-start">
          <Button variant="outline" onClick={back} className="min-h-11 rounded-xl">
            Back
          </Button>
        </div>
      )}

      <AlertDialog open={restartOpen} onOpenChange={setRestartOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the details you have entered for this pet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-xl">Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={restart} className="min-h-11 rounded-xl">
              Yes, start over
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
