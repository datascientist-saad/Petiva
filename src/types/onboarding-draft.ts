import type { DietCalculationResult } from "@/lib/diet-calculations";
import type { ApproximateLifeStage } from "@/lib/nutrition/life-stage";
import type { BirdNutritionResult } from "@/lib/nutrition/bird-calculator";
import type { SupportedSpeciesId } from "@/lib/species/registry";

export type OnboardingDraftStep = "basics" | "body" | "diet" | "preview";
export type FoodEnergyUnit = "per_100g" | "per_cup" | "per_can" | "per_serving";

export interface BirdSpeciesProfile {
  bird_species: string;
  variety: string;
  wing_status: "flighted" | "clipped" | "unknown" | "";
  housing: "indoor_cage" | "aviary" | "mixed" | "";
  pellet_percent: string;
  seed_percent: string;
  vegetable_percent: string;
  fruit_percent: string;
  out_of_cage_hours: string;
  sleep_hours: string;
  lives_with_other_birds: "alone" | "with_other_birds" | "mixed" | "";
  egg_laying: boolean;
  feather_plucking_history: boolean;
}

export interface OnboardingDraftData {
  version: 2;
  step: OnboardingDraftStep;
  stepIndex: number;
  updatedAt: string;
  name: string;
  species: SupportedSpeciesId;
  breed: string;
  birth_date: string;
  estimated_age_years: string;
  estimated_age_months: string;
  use_approximate_age: boolean;
  life_stage: ApproximateLifeStage | "";
  sex: "male" | "female" | "unknown" | "";
  weight_value: string;
  weight_unit: "kg" | "lb" | "g";
  activity_level: "low" | "moderate" | "active" | "very_active" | "";
  body_condition: "underweight" | "ideal" | "overweight" | "unsure" | "";
  neutered: "yes" | "no" | "unknown";
  food_type: "dry" | "wet" | "mixed" | "home_cooked" | "";
  meals_per_day: string;
  food_brand: string;
  food_product: string;
  calories_per_100g: string;
  calories_per_serving: string;
  calorie_unit: FoodEnergyUnit | "";
  mixed_dry_percent: string;
  allergies: string;
  foods_to_avoid: string;
  health_conditions: string[];
  other_condition: string;
  diet_goal: "maintain" | "lose" | "gain" | "improve" | "";
  primary_goal: string;
  species_profile: BirdSpeciesProfile;
  diet_preview?: DietCalculationResult | BirdNutritionResult | null;
}

export const ONBOARDING_DRAFT_STORAGE_KEY = "animivo_onboarding_draft_v2";
export const ONBOARDING_DRAFT_LEGACY_KEY = "animivo_onboarding_draft_v1";
export const ONBOARDING_TRANSFER_FLAG_KEY = "animivo_onboarding_transferred";
export const ONBOARDING_TRANSFER_LOCK_KEY = "animivo_onboarding_transfer_lock";

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
  version: 2,
  step: "basics",
  stepIndex: 0,
  updatedAt: new Date().toISOString(),
  name: "",
  species: "cat",
  breed: "",
  birth_date: "",
  estimated_age_years: "",
  estimated_age_months: "",
  use_approximate_age: false,
  life_stage: "",
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
  calorie_unit: "",
  mixed_dry_percent: "50",
  allergies: "",
  foods_to_avoid: "",
  health_conditions: [],
  other_condition: "",
  diet_goal: "",
  primary_goal: "",
  species_profile: {
    bird_species: "",
    variety: "",
    wing_status: "",
    housing: "",
    pellet_percent: "70",
    seed_percent: "10",
    vegetable_percent: "15",
    fruit_percent: "5",
    out_of_cage_hours: "",
    sleep_hours: "10",
    lives_with_other_birds: "",
    egg_laying: false,
    feather_plucking_history: false,
  },
  diet_preview: null,
});
