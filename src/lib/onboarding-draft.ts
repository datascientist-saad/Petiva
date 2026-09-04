import { calculateDietPlan, kgFromLb, type DietCalculationInput } from "@/lib/diet-calculations";
import { calculateBirdNutrition } from "@/lib/nutrition/bird-calculator";
import { resolveLifeStage, type ApproximateLifeStage } from "@/lib/nutrition/life-stage";
import type { OnboardingDraftData } from "@/types/onboarding-draft";
import {
  ONBOARDING_DRAFT_LEGACY_KEY,
  ONBOARDING_DRAFT_STORAGE_KEY,
  ONBOARDING_TRANSFER_FLAG_KEY,
  ONBOARDING_TRANSFER_LOCK_KEY,
  initialOnboardingDraft,
} from "@/types/onboarding-draft";

function migrateLegacyDraft(raw: Record<string, unknown>): OnboardingDraftData {
  const fresh = initialOnboardingDraft();
  const incomingProfile =
    raw.species_profile && typeof raw.species_profile === "object" && !Array.isArray(raw.species_profile)
      ? (raw.species_profile as Record<string, unknown>)
      : {};
  const merged = {
    ...fresh,
    ...raw,
    version: 2 as const,
    species_profile: {
      ...fresh.species_profile,
      ...incomingProfile,
    },
  };
  const estimatedMonths =
    Number(raw.estimated_age_years || 0) * 12 + Number(raw.estimated_age_months || 0);
  if (!merged.life_stage) {
    if (raw.use_approximate_age && estimatedMonths > 0) {
      merged.life_stage = resolveLifeStage({
        species: String(raw.species || "dog"),
        estimatedAgeMonths: estimatedMonths,
        lifeStage: "unknown",
      }).stage;
    } else if (raw.use_approximate_age) {
      merged.life_stage = "unknown";
    }
  }
  if (typeof merged.stepIndex === "number" && String(raw.step) === "welcome") {
    merged.step = "basics";
    merged.stepIndex = 0;
  }
  if (typeof merged.stepIndex === "number" && merged.stepIndex > 0 && !raw.version) {
    merged.stepIndex = Math.max(0, merged.stepIndex - 1);
  }
  return merged as OnboardingDraftData;
}

export function loadOnboardingDraft(): OnboardingDraftData | null {
  if (typeof window === "undefined") return null;
  try {
    const current = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    const legacy = localStorage.getItem(ONBOARDING_DRAFT_LEGACY_KEY);
    const raw = current ?? legacy;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const draft = migrateLegacyDraft(parsed);
    if (!current) saveOnboardingDraft(draft);
    return draft;
  } catch {
    return null;
  }
}

function setPendingCookie(on: boolean) {
  if (typeof document === "undefined") return;
  const maxAge = on ? 60 * 60 * 24 * 7 : 0;
  document.cookie = `animivo_onboarding_pending=${on ? "1" : ""}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function saveOnboardingDraft(draft: OnboardingDraftData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ONBOARDING_DRAFT_STORAGE_KEY,
    JSON.stringify({ ...draft, version: 2, updatedAt: new Date().toISOString() })
  );
  setPendingCookie(draftHasMeaningfulData(draft));
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_DRAFT_LEGACY_KEY);
  setPendingCookie(false);
}

export function hasOnboardingDraft(): boolean {
  return loadOnboardingDraft() !== null;
}

export function draftHasMeaningfulData(draft: OnboardingDraftData | null): boolean {
  if (!draft) return false;
  return Boolean(
    draft.name.trim() ||
      draft.weight_value ||
      draft.birth_date ||
      draft.life_stage ||
      draft.activity_level ||
      draft.food_type
  );
}

export function markOnboardingTransferred(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_TRANSFER_FLAG_KEY, "1");
  sessionStorage.removeItem(ONBOARDING_TRANSFER_LOCK_KEY);
  clearOnboardingDraft();
}

export function wasOnboardingTransferred(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ONBOARDING_TRANSFER_FLAG_KEY) === "1";
}

export function acquireTransferLock(): boolean {
  if (typeof window === "undefined") return true;
  if (sessionStorage.getItem(ONBOARDING_TRANSFER_LOCK_KEY) === "1") return false;
  sessionStorage.setItem(ONBOARDING_TRANSFER_LOCK_KEY, "1");
  return true;
}

export function releaseTransferLock(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_TRANSFER_LOCK_KEY);
}

export function draftToAgeMonths(draft: OnboardingDraftData): number | null {
  if (draft.birth_date && !draft.use_approximate_age) {
    const birth = new Date(draft.birth_date);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    return Math.max(
      0,
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    );
  }
  if (draft.use_approximate_age) {
    const months =
      Number(draft.estimated_age_years || 0) * 12 + Number(draft.estimated_age_months || 0);
    return months > 0 ? months : null;
  }
  return null;
}

export function draftToLifeStage(draft: OnboardingDraftData): ApproximateLifeStage | null {
  if (draft.life_stage) return draft.life_stage;
  return null;
}

export function draftToWeightKg(draft: OnboardingDraftData): number | null {
  const value = Number(draft.weight_value);
  if (!value || value <= 0) return null;
  if (draft.weight_unit === "lb") return kgFromLb(value);
  if (draft.weight_unit === "g") return value / 1000;
  return value;
}

export function draftToWeightGrams(draft: OnboardingDraftData): number | null {
  const value = Number(draft.weight_value);
  if (!value || value <= 0) return null;
  if (draft.weight_unit === "g") return value;
  const kg = draftToWeightKg(draft);
  return kg != null ? Math.round(kg * 1000) : null;
}

export function draftToBirdNutritionInput(draft: OnboardingDraftData) {
  const profile = {
    ...initialOnboardingDraft().species_profile,
    ...(draft.species_profile ?? {}),
  };
  const weightGrams = draftToWeightGrams(draft) ?? 0;
  const ageMonths = draftToAgeMonths(draft) ?? 0;

  return {
    birdSpecies: profile.bird_species || draft.breed || "Other companion bird",
    weightGrams,
    ageMonths,
    activityLevel: (draft.activity_level || "moderate") as "low" | "moderate" | "active" | "very_active",
    pelletPercentCurrent: Number(profile.pellet_percent) || null,
    seedPercentCurrent: Number(profile.seed_percent) || null,
    vegetablePercentCurrent: Number(profile.vegetable_percent) || null,
    fruitPercentCurrent: Number(profile.fruit_percent) || null,
    eggLaying: Boolean(profile.egg_laying),
    featherPluckingHistory: Boolean(profile.feather_plucking_history),
    healthFlags: draft.health_conditions ?? [],
  };
}

export function draftToDietInput(draft: OnboardingDraftData): DietCalculationInput | null {
  if (draft.species === "bird") return null;
  const weightKg = draftToWeightKg(draft);
  if (!weightKg || !draft.activity_level || !draft.body_condition || !draft.diet_goal || !draft.food_type) {
    return null;
  }

  const conditions = [
    ...draft.health_conditions,
    ...(draft.other_condition.trim() ? [draft.other_condition.trim()] : []),
  ];

  const caloriesPer100g =
    draft.calorie_unit === "per_100g" && draft.calories_per_100g
      ? Number(draft.calories_per_100g)
      : draft.calories_per_100g && !draft.calorie_unit
        ? Number(draft.calories_per_100g)
        : null;

  return {
    species: draft.species as "cat" | "dog",
    weightKg,
    ageMonths: draftToAgeMonths(draft),
    lifeStage: draftToLifeStage(draft),
    birthDate: draft.use_approximate_age ? null : draft.birth_date || null,
    neutered: draft.neutered,
    activityLevel: draft.activity_level,
    bodyCondition: draft.body_condition,
    dietGoal: draft.diet_goal,
    foodType: draft.food_type,
    mealsPerDay: Number(draft.meals_per_day) || 2,
    caloriesPer100g,
    caloriesPerServing: draft.calories_per_serving ? Number(draft.calories_per_serving) : null,
    energyUnit: draft.calorie_unit || null,
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
  if (draft.species === "bird") {
    try {
      return calculateBirdNutrition(draftToBirdNutritionInput(draft));
    } catch {
      return null;
    }
  }
  const input = draftToDietInput(draft);
  if (!input) return null;
  try {
    return calculateDietPlan(input);
  } catch {
    return null;
  }
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
