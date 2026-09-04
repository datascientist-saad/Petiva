import { validateMixedFeedingPercent } from "@/lib/diet-calculations";
import { isValidBirthDate } from "@/lib/nutrition/life-stage";
import type { OnboardingDraftData } from "@/types/onboarding-draft";

export type OnboardingFieldErrors = Record<string, string>;

export function fieldErrorId(field: string): string {
  return `${field}-error`;
}

export function validateOnboardingStep(
  draft: OnboardingDraftData,
  step: number
): { ok: boolean; errors: OnboardingFieldErrors; firstInvalidId: string | null } {
  const errors: OnboardingFieldErrors = {};

  if (step === 0) {
    if (!draft.name.trim()) errors.name = "What's your pet's name?";
    if (draft.use_approximate_age) {
      if (!draft.life_stage) errors.life_stage = "Choose an approximate life stage, or select Not sure.";
    } else if (!draft.birth_date) {
      errors.birth_date = "Enter a date of birth or choose “I don’t know the exact date.”";
    } else if (!isValidBirthDate(draft.birth_date, new Date(), draft.species)) {
      errors.birth_date = "Enter a date that is not in the future and is realistic for this species.";
    }
  }

  if (step === 1) {
    const weight = Number(draft.weight_value);
    if (!draft.weight_value || !Number.isFinite(weight) || weight <= 0) {
      errors.weight_value = "Enter a weight greater than zero.";
    } else if (draft.species === "bird" && (weight < 5 || weight > 3000)) {
      errors.weight_value = "Bird weight should usually be between 5 g and 3,000 g.";
    } else if (draft.species === "cat" && draft.weight_unit !== "g" && weight > (draft.weight_unit === "lb" ? 55 : 25)) {
      errors.weight_value = "That weight looks unusually high for a cat. Check the number and unit.";
    } else if (draft.species === "dog" && draft.weight_unit !== "g" && weight > (draft.weight_unit === "lb" ? 265 : 120)) {
      errors.weight_value = "That weight looks unusually high. Check the number and unit.";
    }
    if (!draft.activity_level) errors.activity_level = "Select an activity level, or choose the closest match.";
    if (draft.species !== "bird" && !draft.body_condition) {
      errors.body_condition = "Select a body condition. Choose Not sure if you are unsure.";
    }
  }

  if (step === 2) {
    if (draft.species === "bird") {
      if (!draft.species_profile.pellet_percent || !draft.species_profile.vegetable_percent) {
        errors.pellet_percent = "Enter the current diet mix so we can organize care tracking.";
      }
    } else {
      if (!draft.food_type) errors.food_type = "Select a food type.";
      if (!draft.diet_goal) errors.diet_goal = "Select a diet goal.";
      if (draft.food_type === "mixed") {
        const dry = Number(draft.mixed_dry_percent) || 0;
        const wet = 100 - dry;
        if (!validateMixedFeedingPercent(dry, wet)) {
          errors.mixed_dry_percent = "Dry and wet percentages must add up to 100%.";
        }
      }
    }
  }

  const firstKey = Object.keys(errors)[0] ?? null;
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    firstInvalidId: firstKey,
  };
}

export function birthDateBounds(species: string, now = new Date()) {
  const max = now.toISOString().slice(0, 10);
  const years = species === "bird" ? 80 : 25;
  const minDate = new Date(now);
  minDate.setFullYear(minDate.getFullYear() - years);
  return { min: minDate.toISOString().slice(0, 10), max };
}

export function activityOptions(species: string): Array<{
  value: "low" | "moderate" | "active" | "very_active";
  label: string;
  description: string;
}> {
  if (species === "bird") {
    return [
      { value: "low", label: "Low", description: "Mostly perching, limited flight" },
      { value: "moderate", label: "Moderate", description: "Regular out-of-cage time" },
      { value: "active", label: "Active", description: "Daily flight and play" },
      { value: "very_active", label: "Very active", description: "Extended flight and enrichment" },
    ];
  }
  if (species === "cat") {
    return [
      { value: "low", label: "Low", description: "Mostly resting, short play" },
      { value: "moderate", label: "Moderate", description: "Regular play or climbing" },
      { value: "active", label: "Active", description: "Daily exercise and hunting play" },
      { value: "very_active", label: "Very active", description: "Highly energetic indoor or outdoor cat" },
    ];
  }
  return [
    { value: "low", label: "Low", description: "Mostly resting, short walks" },
    { value: "moderate", label: "Moderate", description: "Regular walks or play" },
    { value: "active", label: "Active", description: "Daily exercise" },
    { value: "very_active", label: "Very active", description: "Working, sport, or long daily activity" },
  ];
}

export function lifeStageOptions(species: string) {
  if (species === "bird") {
    return [
      { value: "baby", label: "Chick / young bird" },
      { value: "young", label: "Young" },
      { value: "adult", label: "Adult" },
      { value: "senior", label: "Senior" },
      { value: "unknown", label: "Not sure" },
    ];
  }
  if (species === "cat") {
    return [
      { value: "baby", label: "Kitten" },
      { value: "young", label: "Young" },
      { value: "adult", label: "Adult" },
      { value: "senior", label: "Senior" },
      { value: "unknown", label: "Not sure" },
    ];
  }
  return [
    { value: "baby", label: "Puppy" },
    { value: "young", label: "Young" },
    { value: "adult", label: "Adult" },
    { value: "senior", label: "Senior" },
    { value: "unknown", label: "Not sure" },
  ];
}
