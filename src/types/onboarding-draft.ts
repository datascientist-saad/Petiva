import type { DietCalculationResult } from "@/lib/diet-calculations";

export type OnboardingDraftStep = "welcome" | "basics" | "body" | "diet" | "preview";

export interface OnboardingDraftData {
  version: 1;
  step: OnboardingDraftStep;
  stepIndex: number;
  updatedAt: string;
  name: string;
  species: "cat" | "dog";
  breed: string;
  birth_date: string;
  estimated_age_years: string;
  estimated_age_months: string;
  use_approximate_age: boolean;
  sex: "male" | "female" | "";
  weight_value: string;
  weight_unit: "kg" | "lb";
  activity_level: "low" | "moderate" | "active" | "very_active" | "";
  body_condition: "underweight" | "ideal" | "overweight" | "unsure" | "";
  neutered: "yes" | "no" | "unknown";
  food_type: "dry" | "wet" | "mixed" | "home_cooked" | "";
  meals_per_day: string;
  food_brand: string;
  food_product: string;
  calories_per_100g: string;
  calories_per_serving: string;
  mixed_dry_percent: string;
  allergies: string;
  foods_to_avoid: string;
  health_conditions: string[];
  other_condition: string;
  diet_goal: "maintain" | "lose" | "gain" | "improve" | "";
  diet_preview?: DietCalculationResult | null;
}

export const ONBOARDING_DRAFT_STORAGE_KEY = "petiva_onboarding_draft_v1";
export const ONBOARDING_TRANSFER_FLAG_KEY = "petiva_onboarding_transferred";

export const HEALTH_CONDITION_OPTIONS = [
  "Arthritis",
  "Diabetes",
  "Kidney disease",
  "Heart disease",
  "Food sensitivities",
  "Digestive issues",
  "Skin allergies",
  "Obesity",
  "Underweight",
  "Pregnancy",
  "Nursing",
] as const;

export const initialOnboardingDraft = (): OnboardingDraftData => ({
  version: 1,
  step: "welcome",
  stepIndex: 0,
  updatedAt: new Date().toISOString(),
  name: "",
  species: "cat",
  breed: "",
  birth_date: "",
  estimated_age_years: "",
  estimated_age_months: "",
  use_approximate_age: false,
  sex: "",
  weight_value: "",
  weight_unit: "kg",
  activity_level: "",
  body_condition: "",
  neutered: "unknown",
  food_type: "",
  meals_per_day: "2",
  food_brand: "",
  food_product: "",
  calories_per_100g: "",
  calories_per_serving: "",
  mixed_dry_percent: "50",
  allergies: "",
  foods_to_avoid: "",
  health_conditions: [],
  other_condition: "",
  diet_goal: "",
  diet_preview: null,
});
