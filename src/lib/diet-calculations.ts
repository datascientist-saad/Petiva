/**
 * Compatibility wrapper around the centralized mammal nutrition service.
 * New code should import from `@/lib/nutrition/mammal-calculator`.
 */
export {
  calculateDietPlan,
  calculateRER,
  kgFromLb,
  lbFromKg,
  validateMixedFeedingPercent,
  buildMealSchedule,
  splitDailyCalories,
  NutritionValidationError,
  type BodyCondition,
  type DietGoal,
  type ExtendedActivity,
  type DietFoodType,
  type DietCalculationInput,
  type DietCalculationResult,
  type MealScheduleItem,
} from "@/lib/nutrition/mammal-calculator";

export { NUTRITION_SAFETY_NOTICE as DIET_SAFETY_NOTICE } from "@/lib/nutrition/constants";
