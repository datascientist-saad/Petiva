import {
  ADULT_ACTIVITY_DELTA,
  BASE_MER_FACTORS,
  BODY_CONDITION_ADJUSTMENT,
  GOAL_ADJUSTMENT,
  HIGH_RISK_CONDITION_TERMS,
  HIGH_RISK_ESCALATION,
  KG_PER_LB,
  NUTRITION_ENGINE_VERSION,
  NUTRITION_SAFETY_NOTICE,
  RANGE_FACTOR,
  RER_COEFFICIENT,
  RER_EXPONENT,
  TREAT_ALLOWANCE_FRACTION,
  WEIGHT_LIMITS,
} from "./constants";
import {
  resolveLifeStage,
  type ApproximateLifeStage,
  type ResolvedLifeStage,
} from "./life-stage";

export type BodyCondition = "underweight" | "ideal" | "overweight" | "unsure";
export type DietGoal = "maintain" | "lose" | "gain" | "improve";
export type ExtendedActivity = "low" | "moderate" | "active" | "very_active";
export type DietFoodType = "dry" | "wet" | "mixed" | "home_cooked";
export type NeuteredStatus = "yes" | "no" | "unknown";
export type FoodEnergyUnit = "per_100g" | "per_cup" | "per_can" | "per_serving";

export interface DietCalculationInput {
  species: "cat" | "dog";
  weightKg: number;
  ageMonths?: number | null;
  lifeStage?: ApproximateLifeStage | null;
  birthDate?: string | null;
  neutered: NeuteredStatus;
  activityLevel: ExtendedActivity;
  bodyCondition: BodyCondition;
  dietGoal: DietGoal;
  foodType: DietFoodType;
  mealsPerDay: number;
  caloriesPer100g?: number | null;
  caloriesPerServing?: number | null;
  energyUnit?: FoodEnergyUnit | null;
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
  engineVersion: string;
  rerKcal: number;
  merKcal: number;
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
  recommendationBlocked: boolean;
  influencingFactors: string[];
  assumptions: string[];
  isEstimate: boolean;
  safetyNotice: string;
  reviewByDays: number;
}

export class NutritionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NutritionValidationError";
  }
}

export function kgFromLb(lb: number): number {
  return lb * KG_PER_LB;
}

export function lbFromKg(kg: number): number {
  return kg / KG_PER_LB;
}

export function calculateRER(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new NutritionValidationError("Weight must be a positive number to calculate RER.");
  }
  return RER_COEFFICIENT * Math.pow(weightKg, RER_EXPONENT);
}

export function validateMixedFeedingPercent(dryPercent: number, wetPercent: number): boolean {
  return dryPercent + wetPercent === 100;
}

export function validateMammalWeight(species: "cat" | "dog", weightKg: number): void {
  if (!Number.isFinite(weightKg)) {
    throw new NutritionValidationError("Enter a valid weight.");
  }
  if (weightKg === 0) {
    throw new NutritionValidationError("Weight cannot be zero.");
  }
  if (weightKg < 0) {
    throw new NutritionValidationError("Weight cannot be negative.");
  }
  const limits = WEIGHT_LIMITS[species];
  if (weightKg > limits.implausibleKg) {
    throw new NutritionValidationError(
      `That weight is outside a plausible range for a ${species}. Check the number and unit.`
    );
  }
}

function hasBlockingMedicalRisk(input: DietCalculationInput): boolean {
  const conditionText = [...(input.conditions ?? [])].join(" ").toLowerCase();
  return HIGH_RISK_CONDITION_TERMS.some((term) => conditionText.includes(term));
}

function reproductiveKey(neutered: NeuteredStatus): "intact" | "neutered" | "unknown" {
  if (neutered === "yes") return "neutered";
  if (neutered === "no") return "intact";
  return "unknown";
}

function selectBaseFactor(
  species: "cat" | "dog",
  stage: ResolvedLifeStage,
  neutered: NeuteredStatus
): { factor: number; label: string } {
  const table = BASE_MER_FACTORS[species];
  if (stage === "baby") {
    return {
      factor: table.baby,
      label: species === "dog" ? "puppy growth factor" : "kitten growth factor",
    };
  }
  if (stage === "young") {
    return {
      factor: table.young,
      label: species === "dog" ? "young-dog growth factor" : "young-cat growth factor",
    };
  }

  const repro = reproductiveKey(neutered);
  const key = `${stage}_${repro}` as keyof typeof table;
  const factor = table[key];
  const reproLabel =
    repro === "neutered" ? "neutered/spayed" : repro === "intact" ? "intact" : "unknown reproductive status";
  return {
    factor,
    label: `${stage} ${species}, ${reproLabel}`,
  };
}

function applyAdultActivity(
  species: "cat" | "dog",
  stage: ResolvedLifeStage,
  base: number,
  activity: ExtendedActivity
): { factor: number; label: string | null } {
  if (stage === "baby" || stage === "young") {
    return { factor: base, label: null };
  }
  const delta = ADULT_ACTIVITY_DELTA[species][activity];
  const minFloor = species === "dog" ? 1.2 : 1.0;
  const maxCeil = species === "dog" ? 2.2 : 1.6;
  return {
    factor: Math.min(maxCeil, Math.max(minFloor, base + delta)),
    label: `${activity.replace("_", " ")} activity refinement`,
  };
}

function applyGoalOrCondition(
  factor: number,
  goal: DietGoal,
  bodyCondition: BodyCondition
): { factor: number; label: string } {
  if (goal === "lose" || goal === "gain") {
    return {
      factor: factor * GOAL_ADJUSTMENT[goal],
      label: goal === "lose" ? "weight-loss goal" : "weight-gain goal",
    };
  }
  if (bodyCondition === "underweight" || bodyCondition === "overweight") {
    return {
      factor: factor * BODY_CONDITION_ADJUSTMENT[bodyCondition],
      label: `${bodyCondition} body-condition adjustment`,
    };
  }
  return { factor, label: "weight-maintenance goal" };
}

export function splitDailyCalories(totalKcal: number, mealsPerDay: number): number[] {
  const meals = Math.min(Math.max(Math.round(mealsPerDay) || 2, 1), 4);
  const target = Math.round(totalKcal);
  const base = Math.floor(target / meals);
  const remainder = target - base * meals;
  return Array.from({ length: meals }, (_, index) => base + (index < remainder ? 1 : 0));
}

function mealTimes(meals: number): string[] {
  if (meals >= 4) return ["07:00", "12:00", "17:00", "21:00"];
  if (meals === 3) return ["08:00", "13:00", "18:00"];
  if (meals === 1) return ["09:00"];
  return ["08:00", "18:00"];
}

export function buildMealSchedule(mealsPerDay: number, totalKcal: number): MealScheduleItem[] {
  const calories = splitDailyCalories(totalKcal, mealsPerDay);
  const times = mealTimes(calories.length);
  return calories.map((kcal, index) => ({
    mealIndex: index,
    label: `Meal ${index + 1}`,
    time: times[index],
    calories: kcal,
  }));
}

function blockedResult(
  rer: number,
  warnings: string[],
  assumptions: string[],
  influencingFactors: string[]
): DietCalculationResult {
  return {
    engineVersion: NUTRITION_ENGINE_VERSION,
    rerKcal: Math.round(rer),
    merKcal: 0,
    merKcalMin: 0,
    merKcalMax: 0,
    recommendedMealsPerDay: 0,
    mealSchedule: [],
    dailyFoodGrams: null,
    dryFoodGrams: null,
    wetFoodGrams: null,
    perMealGrams: null,
    perMealDryGrams: null,
    perMealWetGrams: null,
    hydrationGuidance: "Keep fresh water available at all times.",
    treatAllowanceKcal: 0,
    adjustmentGuidance:
      "Do not use an automated calorie target for this situation. Ask a veterinarian for an individualized plan.",
    warnings,
    elevatedVetWarning: true,
    recommendationBlocked: true,
    influencingFactors,
    assumptions,
    isEstimate: true,
    safetyNotice: NUTRITION_SAFETY_NOTICE,
    reviewByDays: 7,
  };
}

export function calculateDietPlan(input: DietCalculationInput): DietCalculationResult {
  validateMammalWeight(input.species, input.weightKg);

  const warnings: string[] = [];
  const assumptions: string[] = [];
  const influencingFactors: string[] = [];

  const life = resolveLifeStage({
    species: input.species,
    lifeStage: input.lifeStage,
    birthDate: input.birthDate,
    estimatedAgeMonths: input.ageMonths,
  });

  if (life.assumption) assumptions.push(life.assumption);
  influencingFactors.push(
    life.source === "date_of_birth"
      ? `Life stage from date of birth (${life.stage})`
      : life.source === "explicit"
        ? `Life stage selected by you (${life.stage})`
        : "Adult life stage assumed because age was unknown"
  );

  const rer = calculateRER(input.weightKg);
  influencingFactors.push(`RER = ${RER_COEFFICIENT} × ${input.weightKg} kg^${RER_EXPONENT}`);

  if (hasBlockingMedicalRisk(input)) {
    warnings.push(HIGH_RISK_ESCALATION);
    influencingFactors.push("A high-risk medical or reproductive condition was reported");
    return blockedResult(rer, warnings, assumptions, influencingFactors);
  }

  let elevatedVetWarning = false;
  if (life.stage === "baby" || life.stage === "young") {
    elevatedVetWarning = true;
    warnings.push(
      "Growing animals have rapidly changing needs. Use this estimate only as a starting point and confirm feeding amounts with a veterinarian."
    );
  }
  if (input.bodyCondition === "underweight" || input.bodyCondition === "overweight") {
    elevatedVetWarning = true;
    warnings.push(
      "Body condition outside the ideal range should be reviewed with a veterinarian. Changes in calories should be gradual and monitored."
    );
  }

  const base = selectBaseFactor(input.species, life.stage, input.neutered);
  influencingFactors.push(base.label);

  const withActivity = applyAdultActivity(input.species, life.stage, base.factor, input.activityLevel);
  if (withActivity.label) influencingFactors.push(withActivity.label);

  const withGoal = applyGoalOrCondition(withActivity.factor, input.dietGoal, input.bodyCondition);
  influencingFactors.push(withGoal.label);

  const mer = rer * withGoal.factor;
  const merMin = Math.round(mer * RANGE_FACTOR.min);
  const merMax = Math.round(mer * RANGE_FACTOR.max);
  const merKcal = Math.round(mer);

  const mealsPerDay = Math.min(Math.max(input.mealsPerDay || 2, 1), 4);
  const mealSchedule = buildMealSchedule(mealsPerDay, merKcal);

  const hasEnergyDensity = Boolean(input.caloriesPer100g && input.caloriesPer100g > 0);
  const dailyGrams = hasEnergyDensity
    ? Math.round((merKcal / (input.caloriesPer100g as number)) * 100)
    : null;
  const perMealGrams = dailyGrams != null ? Math.round(dailyGrams / mealsPerDay) : null;

  if (!hasEnergyDensity) {
    assumptions.push(
      "Package energy density was not provided, so only calorie guidance is shown. Check the food label for kcal per 100 g, kcal per cup, kcal per can, or kcal per serving before converting to grams."
    );
  }

  let dryFoodGrams: number | null = null;
  let wetFoodGrams: number | null = null;
  let perMealDryGrams: number | null = null;
  let perMealWetGrams: number | null = null;

  if (input.foodType === "mixed" && hasEnergyDensity && input.caloriesPer100g) {
    const dryPct = input.mixedDryPercent ?? 50;
    const dryKcal = merKcal * (dryPct / 100);
    const wetKcal = merKcal * ((100 - dryPct) / 100);
    dryFoodGrams = Math.round((dryKcal / input.caloriesPer100g) * 100);
    wetFoodGrams = Math.round((wetKcal / input.caloriesPer100g) * 100);
    perMealDryGrams = Math.round(dryFoodGrams / mealsPerDay);
    perMealWetGrams = Math.round(wetFoodGrams / mealsPerDay);
  }

  if ((input.allergies?.length ?? 0) > 0) {
    warnings.push(`Avoid known allergens: ${input.allergies!.join(", ")}.`);
  }

  warnings.push(
    "Monitor weight and body condition every 2–4 weeks and ask a veterinarian before making large diet changes."
  );

  return {
    engineVersion: NUTRITION_ENGINE_VERSION,
    rerKcal: Math.round(rer),
    merKcal,
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
    hydrationGuidance:
      input.species === "cat"
        ? "Ensure fresh water is always available. Wet food can help with hydration."
        : "Provide constant access to fresh water, especially with dry food diets.",
    treatAllowanceKcal: Math.round(merKcal * TREAT_ALLOWANCE_FRACTION),
    adjustmentGuidance:
      "Weigh your pet every 2–4 weeks. If weight changes more than about 5% in a month, adjust portions gradually and consult your veterinarian.",
    warnings,
    elevatedVetWarning,
    recommendationBlocked: false,
    influencingFactors,
    assumptions,
    isEstimate: true,
    safetyNotice: NUTRITION_SAFETY_NOTICE,
    reviewByDays: 30,
  };
}
