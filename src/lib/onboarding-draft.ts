import { calculateDietPlan, kgFromLb, type DietCalculationInput } from "@/lib/diet-calculations";
import type { OnboardingDraftData } from "@/types/onboarding-draft";
import {
  ONBOARDING_DRAFT_STORAGE_KEY,
  ONBOARDING_TRANSFER_FLAG_KEY,
  initialOnboardingDraft,
} from "@/types/onboarding-draft";

export function loadOnboardingDraft(): OnboardingDraftData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraftData;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(draft: OnboardingDraftData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ONBOARDING_DRAFT_STORAGE_KEY,
    JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
  );
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
}

export function hasOnboardingDraft(): boolean {
  return loadOnboardingDraft() !== null;
}

export function markOnboardingTransferred(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_TRANSFER_FLAG_KEY, "1");
  clearOnboardingDraft();
}

export function wasOnboardingTransferred(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ONBOARDING_TRANSFER_FLAG_KEY) === "1";
}

export function draftToAgeMonths(draft: OnboardingDraftData): number {
  if (draft.use_approximate_age) {
    return Number(draft.estimated_age_years || 0) * 12 + Number(draft.estimated_age_months || 0);
  }
  if (draft.birth_date) {
    const birth = new Date(draft.birth_date);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  }
  return 24;
}

export function draftToWeightKg(draft: OnboardingDraftData): number | null {
  const value = Number(draft.weight_value);
  if (!value || value <= 0) return null;
  return draft.weight_unit === "lb" ? kgFromLb(value) : value;
}

export function draftToDietInput(draft: OnboardingDraftData): DietCalculationInput | null {
  const weightKg = draftToWeightKg(draft);
  if (!weightKg || !draft.activity_level || !draft.body_condition || !draft.diet_goal || !draft.food_type) {
    return null;
  }

  const conditions = [
    ...draft.health_conditions,
    ...(draft.other_condition.trim() ? [draft.other_condition.trim()] : []),
  ];

  return {
    species: draft.species,
    weightKg,
    ageMonths: draftToAgeMonths(draft),
    neutered: draft.neutered,
    activityLevel: draft.activity_level,
    bodyCondition: draft.body_condition,
    dietGoal: draft.diet_goal,
    foodType: draft.food_type,
    mealsPerDay: Number(draft.meals_per_day) || 2,
    caloriesPer100g: draft.calories_per_100g ? Number(draft.calories_per_100g) : null,
    caloriesPerServing: draft.calories_per_serving ? Number(draft.calories_per_serving) : null,
    mixedDryPercent: draft.food_type === "mixed" ? Number(draft.mixed_dry_percent) || 50 : null,
    allergies: draft.allergies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    conditions,
    sex: draft.sex || null,
  };
}

export function buildDietPreviewFromDraft(draft: OnboardingDraftData) {
  const input = draftToDietInput(draft);
  if (!input) return null;
  return calculateDietPlan(input);
}

export function resetOnboardingDraft(): OnboardingDraftData {
  const fresh = initialOnboardingDraft();
  saveOnboardingDraft(fresh);
  return fresh;
}

export function mapDraftFoodType(
  foodType: OnboardingDraftData["food_type"]
): "dry" | "wet" | "mixed" | "raw" | "other" | null {
  if (!foodType) return null;
  if (foodType === "home_cooked") return "other";
  return foodType;
}

export function mapDraftActivity(
  level: OnboardingDraftData["activity_level"]
): "low" | "moderate" | "high" | null {
  if (!level) return null;
  if (level === "active" || level === "very_active") return "high";
  return level;
}
