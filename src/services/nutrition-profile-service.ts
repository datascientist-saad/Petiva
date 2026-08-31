import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import {
  calculateNutritionPlan,
  NUTRITION_ENGINE_VERSION,
  type NutritionPlanResult,
} from "@/lib/nutrition/engine";
import type { DietCalculationInput } from "@/lib/diet-calculations";
import type { BirdNutritionInput } from "@/lib/nutrition/bird-calculator";
import { speciesUsesBirdNutrition } from "@/lib/species/registry";

export class NutritionProfileService {
  constructor(private supabase: SupabaseClient) {}

  async getForPet(petId: string) {
    const { data, error } = await this.supabase
      .from("nutrition_profiles")
      .select("*")
      .eq("pet_id", petId)
      .maybeSingle();
    if (error) throw new AppError("Could not load nutrition profile.", { cause: error });
    return data;
  }

  async savePlanResult(
    petId: string,
    species: string,
    input: DietCalculationInput | BirdNutritionInput,
    plan: NutritionPlanResult
  ) {
    const engineType = speciesUsesBirdNutrition(species) ? "bird" : "mammal";
    const { error } = await this.supabase.from("nutrition_profiles").upsert(
      {
        pet_id: petId,
        engine_type: engineType,
        engine_version: NUTRITION_ENGINE_VERSION,
        reference_version:
          plan.engine === "bird" ? plan.result.referenceVersion : NUTRITION_ENGINE_VERSION,
        profile: { input, plan },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "pet_id" }
    );
    if (error) throw new AppError("Could not save nutrition profile.", { cause: error });
  }

  calculate(species: string, input: DietCalculationInput | BirdNutritionInput): NutritionPlanResult {
    return calculateNutritionPlan(species, input);
  }
}
