import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import type { MealLog, WeightRecord } from "@/types/database";

export class NutritionService {
  constructor(private supabase: SupabaseClient) {}

  async listMeals(petId: string, sinceIso?: string): Promise<MealLog[]> {
    let query = this.supabase
      .from("meal_logs")
      .select("*")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: false });
    if (sinceIso) query = query.gte("logged_at", sinceIso);
    const { data, error } = await query;
    if (error) throw new AppError("Could not load meals.", { cause: error });
    return data ?? [];
  }

  async logMeal(
    petId: string,
    userId: string,
    input: { food_name: string; amount: number; unit: MealLog["unit"]; logged_at: string; notes?: string | null }
  ) {
    const { data, error } = await this.supabase
      .from("meal_logs")
      .insert({ ...input, pet_id: petId, created_by: userId })
      .select("*")
      .single();
    if (error) throw new AppError("Could not log meal.", { cause: error });
    return data as MealLog;
  }
}

export class WeightService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string): Promise<WeightRecord[]> {
    const { data, error } = await this.supabase
      .from("weight_records")
      .select("*")
      .eq("pet_id", petId)
      .order("recorded_at", { ascending: true });
    if (error) throw new AppError("Could not load weight history.", { cause: error });
    return data ?? [];
  }

  async add(
    petId: string,
    userId: string,
    input: { weight_kg: number; recorded_at: string; notes?: string | null }
  ) {
    const { data, error } = await this.supabase
      .from("weight_records")
      .insert({ ...input, pet_id: petId, created_by: userId })
      .select("*")
      .single();
    if (error) throw new AppError("Could not add weight.", { cause: error });

    await this.supabase.from("pets").update({ weight_kg: input.weight_kg }).eq("id", petId);
    return data as WeightRecord;
  }
}
