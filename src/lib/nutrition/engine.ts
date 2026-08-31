import { calculateDietPlan, type DietCalculationInput, type DietCalculationResult } from "@/lib/diet-calculations";
import { getSpeciesDefinition } from "@/lib/species/registry";
import {
  calculateBirdNutrition,
  gramsFromKg,
  kgFromGrams,
  type BirdNutritionInput,
  type BirdNutritionResult,
} from "./bird-calculator";

export type NutritionEngineType = "mammal" | "bird" | "unsupported";

export type NutritionPlanResult =
  | { engine: "mammal"; result: DietCalculationResult }
  | { engine: "bird"; result: BirdNutritionResult }
  | { engine: "unsupported"; message: string };

export const NUTRITION_ENGINE_VERSION = "2026.08.31";

export function resolveNutritionEngine(species: string): NutritionEngineType {
  const def = getSpeciesDefinition(species);
  if (def.nutritionEngine === "mammal") return "mammal";
  if (def.nutritionEngine === "bird") return "bird";
  return "unsupported";
}

export function calculateNutritionPlan(
  species: string,
  input: DietCalculationInput | BirdNutritionInput
): NutritionPlanResult {
  const engine = resolveNutritionEngine(species);
  if (engine === "mammal") {
    return { engine: "mammal", result: calculateDietPlan(input as DietCalculationInput) };
  }
  if (engine === "bird") {
    return { engine: "bird", result: calculateBirdNutrition(input as BirdNutritionInput) };
  }
  return {
    engine: "unsupported",
    message: `${getSpeciesDefinition(species).displayName} nutrition is not yet available in Animivo.`,
  };
}

export { gramsFromKg, kgFromGrams };
