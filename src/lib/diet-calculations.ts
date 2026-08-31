/**
 * Pet diet calculations using RER (Resting Energy Requirement) and MER (Maintenance Energy Requirement).
 * Estimates only — not veterinary advice.
 */

export type BodyCondition = "underweight" | "ideal" | "overweight" | "unsure";
export type DietGoal = "maintain" | "lose" | "gain" | "improve";
export type ExtendedActivity = "low" | "moderate" | "active" | "very_active";
export type DietFoodType = "dry" | "wet" | "mixed" | "home_cooked";

export interface DietCalculationInput {
  species: "cat" | "dog";
  weightKg: number;
  ageMonths: number;
  neutered: "yes" | "no" | "unknown";
  activityLevel: ExtendedActivity;
  bodyCondition: BodyCondition;
  dietGoal: DietGoal;
  foodType: DietFoodType;
  mealsPerDay: number;
  caloriesPer100g?: number | null;
  caloriesPerServing?: number | null;
  mixedDryPercent?: number | null;
  allergies?: string[];
  conditions?: string[];
  sex?: "male" | "female" | "unknown" | null;
}

export interface MealScheduleItem {
  mealIndex: number;
  label: string;
  time: string;
  calories: number;
}

export interface DietCalculationResult {
  rerKcal: number;
  merKcalMin: number;
  merKcalMax: number;
  recommendedMealsPerDay: number;
  mealSchedule: MealScheduleItem[];
  dailyFoodGrams: number | null;
  dryFoodGrams: number | null;
  wetFoodGrams: number | null;
  perMealGrams: number | null;
  perMealDryGrams: number | null;
  perMealWetGrams: number | null;
  hydrationGuidance: string;
  treatAllowanceKcal: number;
  adjustmentGuidance: string;
  warnings: string[];
  elevatedVetWarning: boolean;
  influencingFactors: string[];
  isEstimate: boolean;
  safetyNotice: string;
  reviewByDays: number;
}

export const DIET_SAFETY_NOTICE =
  "This plan is an estimate for general guidance and does not replace advice from a veterinarian. Pets that are very young, pregnant, nursing, underweight, overweight, unwell, or managing a medical condition should have their diet reviewed by a veterinarian.";

const SERIOUS_CONDITIONS = [
  "diabetes",
  "kidney",
  "renal",
  "heart disease",
  "cardiac",
  "liver",
  "pancreatitis",
  "cancer",
  "hyperthyroid",
  "hypothyroid",
  "ibd",
  "pregnancy",
  "pregnant",
  "nursing",
  "lactating",
];

export function kgFromLb(lb: number): number {
  return lb * 0.453592;
}

export function lbFromKg(kg: number): number {
  return kg / 0.453592;
}

export function validateMixedFeedingPercent(dryPercent: number, wetPercent: number): boolean {
  return dryPercent + wetPercent === 100;
}

export function calculateRER(weightKg: number): number {
  if (weightKg <= 0) return 0;
  return 70 * Math.pow(weightKg, 0.75);
}

function lifeStageMultiplier(species: "cat" | "dog", ageMonths: number): { mult: number; label: string } {
  if (species === "cat") {
    if (ageMonths < 4) return { mult: 2.5, label: "kitten (under 4 months)" };
    if (ageMonths < 12) return { mult: 2.0, label: "kitten (4–12 months)" };
    return { mult: 1.0, label: "adult" };
  }
  if (ageMonths < 4) return { mult: 3.0, label: "puppy (under 4 months)" };
  if (ageMonths < 12) return { mult: 2.0, label: "puppy (4–12 months)" };
  return { mult: 1.0, label: "adult" };
}

function activityMultiplier(level: ExtendedActivity): { mult: number; label: string } {
  switch (level) {
    case "low":
      return { mult: 1.0, label: "low activity" };
    case "moderate":
      return { mult: 1.2, label: "moderate activity" };
    case "active":
      return { mult: 1.4, label: "active lifestyle" };
    case "very_active":
      return { mult: 1.6, label: "very active lifestyle" };
  }
}

function neuterMultiplier(neutered: "yes" | "no" | "unknown", species: "cat" | "dog"): { mult: number; label: string } {
  if (neutered === "yes") {
    return { mult: species === "cat" ? 1.0 : 1.0, label: "neutered/spayed" };
  }
  if (neutered === "no") {
    return { mult: species === "cat" ? 1.2 : 1.4, label: "intact" };
  }
  return { mult: 1.1, label: "neuter status unknown" };
}

function bodyConditionAdjustment(bodyCondition: BodyCondition): { mult: number; label: string } {
  switch (bodyCondition) {
    case "underweight":
      return { mult: 1.15, label: "underweight body condition" };
    case "overweight":
      return { mult: 0.85, label: "overweight body condition" };
    case "ideal":
      return { mult: 1.0, label: "ideal body condition" };
    case "unsure":
      return { mult: 1.0, label: "body condition not specified" };
  }
}

function dietGoalAdjustment(goal: DietGoal): { mult: number; label: string } {
  switch (goal) {
    case "lose":
      return { mult: 0.85, label: "weight loss goal (moderate deficit)" };
    case "gain":
      return { mult: 1.1, label: "weight gain goal" };
    case "improve":
      return { mult: 1.0, label: "general nutrition improvement" };
    case "maintain":
    default:
      return { mult: 1.0, label: "weight maintenance goal" };
  }
}

function defaultCaloriesPer100g(foodType: DietFoodType, species: "cat" | "dog"): number {
  if (foodType === "wet") return species === "cat" ? 85 : 90;
  if (foodType === "mixed") return species === "cat" ? 320 : 350;
  if (foodType === "home_cooked") return 120;
  return species === "cat" ? 380 : 360;
}

function buildMealSchedule(mealsPerDay: number, totalKcal: number): MealScheduleItem[] {
  const times =
    mealsPerDay >= 4
      ? ["07:00", "12:00", "17:00", "21:00"]
      : mealsPerDay === 3
        ? ["08:00", "13:00", "18:00"]
        : mealsPerDay === 1
          ? ["09:00"]
          : ["08:00", "18:00"];

  const schedule = times.slice(0, mealsPerDay);
  const perMeal = totalKcal / schedule.length;

  return schedule.map((time, index) => ({
    mealIndex: index,
    label: `Meal ${index + 1}`,
    time,
    calories: Math.round(perMeal),
  }));
}

export function calculateDietPlan(input: DietCalculationInput): DietCalculationResult {
  const warnings: string[] = [];
  const influencingFactors: string[] = [];
  let elevatedVetWarning = false;

  const rer = calculateRER(input.weightKg);
  const life = lifeStageMultiplier(input.species, input.ageMonths);
  const activity = activityMultiplier(input.activityLevel);
  const neuter = neuterMultiplier(input.neutered, input.species);
  const body = bodyConditionAdjustment(input.bodyCondition);
  const goal = dietGoalAdjustment(input.dietGoal);

  influencingFactors.push(life.label, activity.label, neuter.label, body.label, goal.label);

  if (input.ageMonths < 12) {
    warnings.push("Growing puppies and kittens need veterinarian-guided nutrition.");
    elevatedVetWarning = true;
  }

  if (input.bodyCondition === "underweight" || input.bodyCondition === "overweight") {
    warnings.push("Body condition outside ideal range — a veterinarian should review feeding targets.");
    elevatedVetWarning = true;
  }

  const conditionText = [...(input.conditions ?? []), ...(input.allergies ?? [])]
    .join(" ")
    .toLowerCase();
  for (const term of SERIOUS_CONDITIONS) {
    if (conditionText.includes(term)) {
      warnings.push(`A health condition (${term}) was noted — please confirm this plan with your veterinarian.`);
      elevatedVetWarning = true;
      break;
    }
  }

  if (input.dietGoal === "lose" && input.bodyCondition !== "overweight") {
    warnings.push("Weight loss plans are safest when supervised by a veterinarian.");
  }

  let baseMer = rer * life.mult * activity.mult * neuter.mult * body.mult * goal.mult;

  if (input.species === "cat" && input.ageMonths >= 12) {
    baseMer = Math.max(baseMer, rer * 1.0);
  }
  if (input.species === "dog" && input.ageMonths >= 12) {
    baseMer = Math.max(baseMer, rer * 1.2);
  }

  const merMin = Math.round(baseMer * 0.92);
  const merMax = Math.round(baseMer * 1.08);
  const targetKcal = Math.round((merMin + merMax) / 2);

  const mealsPerDay = Math.min(Math.max(input.mealsPerDay || 2, 1), 4);
  const mealSchedule = buildMealSchedule(mealsPerDay, targetKcal);

  const hasCalorieData = Boolean(input.caloriesPer100g || input.caloriesPerServing);
  const calPer100g =
    input.caloriesPer100g ??
    (input.caloriesPerServing ? (input.caloriesPerServing / 100) * 100 : null) ??
    defaultCaloriesPer100g(input.foodType, input.species);

  const isEstimate = !hasCalorieData;
  const dailyGrams = calPer100g > 0 ? Math.round((targetKcal / calPer100g) * 100) : null;
  const perMealGrams = dailyGrams != null ? Math.round(dailyGrams / mealsPerDay) : null;

  let dryFoodGrams: number | null = null;
  let wetFoodGrams: number | null = null;
  let perMealDryGrams: number | null = null;
  let perMealWetGrams: number | null = null;

  if (input.foodType === "mixed" && dailyGrams != null) {
    const dryPct = input.mixedDryPercent ?? 50;
    const wetPct = 100 - dryPct;
    const dryCal = defaultCaloriesPer100g("dry", input.species);
    const wetCal = defaultCaloriesPer100g("wet", input.species);
    const dryKcal = targetKcal * (dryPct / 100);
    const wetKcal = targetKcal * (wetPct / 100);
    dryFoodGrams = Math.round((dryKcal / dryCal) * 100);
    wetFoodGrams = Math.round((wetKcal / wetCal) * 100);
    perMealDryGrams = Math.round(dryFoodGrams / mealsPerDay);
    perMealWetGrams = Math.round(wetFoodGrams / mealsPerDay);
  }

  const treatAllowanceKcal = Math.round(targetKcal * 0.1);

  const hydrationGuidance =
    input.species === "cat"
      ? "Ensure fresh water is always available. Wet food can help with hydration."
      : "Provide constant access to fresh water, especially with dry food diets.";

  const adjustmentGuidance =
    "Weigh your pet every 2–4 weeks. If weight changes more than 5% in a month, adjust portions gradually and consult your veterinarian.";

  if ((input.allergies?.length ?? 0) > 0) {
    warnings.push(`Avoid known allergens: ${input.allergies!.join(", ")}.`);
  }

  return {
    rerKcal: Math.round(rer),
    merKcalMin: merMin,
    merKcalMax: merMax,
    recommendedMealsPerDay: mealsPerDay,
    mealSchedule,
    dailyFoodGrams: dailyGrams,
    dryFoodGrams,
    wetFoodGrams,
    perMealGrams,
    perMealDryGrams,
    perMealWetGrams,
    hydrationGuidance,
    treatAllowanceKcal,
    adjustmentGuidance,
    warnings,
    elevatedVetWarning,
    influencingFactors,
    isEstimate,
    safetyNotice: DIET_SAFETY_NOTICE,
    reviewByDays: 30,
  };
}
