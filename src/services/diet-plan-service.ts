import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import {
  calculateDietPlan,
  type DietCalculationInput,
  type DietCalculationResult,
} from "@/lib/diet-calculations";
import type { BirdNutritionInput, BirdNutritionResult } from "@/lib/nutrition/bird-calculator";
import { NUTRITION_ENGINE_VERSION } from "@/lib/nutrition/engine";
import type { DietPlan, Pet } from "@/types/database";

export class DietPlanService {
  constructor(private supabase: SupabaseClient) {}

  buildInputFromPet(pet: Pet, extras?: Partial<DietCalculationInput>): DietCalculationInput | null {
    if (pet.species !== "cat" && pet.species !== "dog") return null;
    if (!pet.weight_kg || !pet.diet_goal) return null;

    const activity =
      pet.activity_level_extended ??
      (pet.activity_level === "high" ? "active" : pet.activity_level) ??
      "moderate";

    const foodType =
      pet.food_type === "raw" || pet.food_type === "other"
        ? "home_cooked"
        : pet.food_type === "mixed"
          ? "mixed"
          : pet.food_type === "wet"
            ? "wet"
            : "dry";

    const ageMonths =
      pet.estimated_age_months ??
      (pet.birth_date
        ? Math.max(
            0,
            (new Date().getFullYear() - new Date(pet.birth_date).getFullYear()) * 12
          )
        : 24);

    return {
      species: pet.species,
      weightKg: Number(pet.weight_kg),
      ageMonths,
      neutered: pet.neutered,
      activityLevel: activity as DietCalculationInput["activityLevel"],
      bodyCondition: pet.body_condition ?? "unsure",
      dietGoal: pet.diet_goal,
      foodType: foodType as DietCalculationInput["foodType"],
      mealsPerDay: pet.meals_per_day ?? 2,
      caloriesPer100g: pet.calories_per_100g,
      caloriesPerServing: pet.calories_per_serving,
      mixedDryPercent: pet.mixed_feeding_dry_percent,
      sex: pet.sex,
      ...extras,
    };
  }

  calculate(input: DietCalculationInput): DietCalculationResult {
    return calculateDietPlan(input);
  }

  async getCurrent(petId: string): Promise<DietPlan | null> {
    const { data, error } = await this.supabase
      .from("diet_plans")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_current", true)
      .maybeSingle();
    if (error) throw new AppError("Could not load diet plan.", { cause: error });
    return data as DietPlan | null;
  }

  async listVersions(petId: string): Promise<DietPlan[]> {
    const { data, error } = await this.supabase
      .from("diet_plans")
      .select("*")
      .eq("pet_id", petId)
      .order("version", { ascending: false });
    if (error) throw new AppError("Could not load diet plan history.", { cause: error });
    return (data ?? []) as DietPlan[];
  }

  async savePlan(
    petId: string,
    userId: string,
    input: DietCalculationInput,
    options?: { vetNotes?: string; ownerNotes?: string; vetApproved?: boolean; replace?: boolean }
  ): Promise<DietPlan> {
    const result = calculateDietPlan(input);

    if (options?.replace !== false) {
      const existing = await this.getCurrent(petId);
      if (existing) {
        await this.supabase.from("diet_plans").update({ is_current: false }).eq("id", existing.id);
      }
    }

    const versions = await this.listVersions(petId);
    const nextVersion = (versions[0]?.version ?? 0) + 1;
    const reviewBy = new Date();
    reviewBy.setDate(reviewBy.getDate() + result.reviewByDays);

    const { data, error } = await this.supabase
      .from("diet_plans")
      .insert({
        pet_id: petId,
        created_by: userId,
        version: nextVersion,
        is_current: true,
        inputs: input,
        result,
        vet_approved: options?.vetApproved ?? false,
        vet_notes: options?.vetNotes ?? null,
        owner_notes: options?.ownerNotes ?? null,
        review_by: reviewBy.toISOString().slice(0, 10),
      })
      .select("*")
      .single();

    if (error) throw new AppError("Could not save diet plan.", { cause: error });
    return data as DietPlan;
  }

  async saveBirdPlan(
    petId: string,
    userId: string,
    input: BirdNutritionInput,
    result: BirdNutritionResult,
    options?: { ownerNotes?: string }
  ): Promise<DietPlan> {
    const existing = await this.getCurrent(petId);
    if (existing) {
      await this.supabase.from("diet_plans").update({ is_current: false }).eq("id", existing.id);
    }

    const versions = await this.listVersions(petId);
    const nextVersion = (versions[0]?.version ?? 0) + 1;
    const reviewBy = new Date();
    reviewBy.setDate(reviewBy.getDate() + 14);

    const { data, error } = await this.supabase
      .from("diet_plans")
      .insert({
        pet_id: petId,
        created_by: userId,
        version: nextVersion,
        is_current: true,
        engine_type: "bird",
        engine_version: NUTRITION_ENGINE_VERSION,
        inputs: input,
        result,
        owner_notes: options?.ownerNotes ?? null,
        review_by: reviewBy.toISOString().slice(0, 10),
      })
      .select("*")
      .single();

    if (error) throw new AppError("Could not save bird diet plan.", { cause: error });
    return data as DietPlan;
  }

  async getTodayFeedingCompletions(petId: string, date = new Date()) {
    const dateStr = date.toISOString().slice(0, 10);
    const { data, error } = await this.supabase
      .from("daily_feeding_completions")
      .select("*")
      .eq("pet_id", petId)
      .eq("completion_date", dateStr);
    if (error) throw new AppError("Could not load feeding progress.", { cause: error });
    return data ?? [];
  }

  async markMealComplete(petId: string, userId: string, mealIndex: number, scheduledTime?: string) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.supabase
      .from("daily_feeding_completions")
      .upsert(
        {
          pet_id: petId,
          completed_by: userId,
          meal_index: mealIndex,
          scheduled_time: scheduledTime ?? null,
          completion_date: dateStr,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "pet_id,completion_date,meal_index" }
      )
      .select("*")
      .single();
    if (error) throw new AppError("Could not mark meal complete.", { cause: error });
    return data;
  }

  async unmarkMealComplete(petId: string, mealIndex: number, date = new Date()) {
    const dateStr = date.toISOString().slice(0, 10);
    const { error } = await this.supabase
      .from("daily_feeding_completions")
      .delete()
      .eq("pet_id", petId)
      .eq("meal_index", mealIndex)
      .eq("completion_date", dateStr);
    if (error) throw new AppError("Could not update meal completion.", { cause: error });
  }
}
