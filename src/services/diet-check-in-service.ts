import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";

export interface DietCheckInInput {
  petId: string;
  createdBy: string;
  weightKg?: number | null;
  weightGrams?: number | null;
  bodyCondition?: string | null;
  appetite?: string | null;
  foodAdherence?: string | null;
  treatIntake?: string | null;
  activityChange?: string | null;
  stoolObservation?: string | null;
  foodAcceptance?: string | null;
  newCondition?: string | null;
  ownerNotes?: string | null;
  planSuitable?: boolean | null;
  adjustmentRecommended?: boolean | null;
}

export interface DietCheckIn {
  id: string;
  pet_id: string;
  check_in_date: string;
  appetite: string | null;
  food_adherence: string | null;
  adjustment_recommended: boolean | null;
  created_at: string;
}

export class DietCheckInService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string, limit = 12): Promise<DietCheckIn[]> {
    const { data, error } = await this.supabase
      .from("diet_check_ins")
      .select("id, pet_id, check_in_date, appetite, food_adherence, adjustment_recommended, created_at")
      .eq("pet_id", petId)
      .order("check_in_date", { ascending: false })
      .limit(limit);
    if (error) throw new AppError("Could not load diet check-ins.", { cause: error });
    return (data ?? []) as DietCheckIn[];
  }

  async create(input: DietCheckInInput) {
    const { data, error } = await this.supabase
      .from("diet_check_ins")
      .insert({
        pet_id: input.petId,
        created_by: input.createdBy,
        weight_kg: input.weightKg ?? null,
        weight_grams: input.weightGrams ?? null,
        body_condition: input.bodyCondition ?? null,
        appetite: input.appetite ?? null,
        food_adherence: input.foodAdherence ?? null,
        treat_intake: input.treatIntake ?? null,
        activity_change: input.activityChange ?? null,
        stool_observation: input.stoolObservation ?? null,
        food_acceptance: input.foodAcceptance ?? null,
        new_condition: input.newCondition ?? null,
        owner_notes: input.ownerNotes ?? null,
        plan_suitable: input.planSuitable ?? null,
        adjustment_recommended: input.adjustmentRecommended ?? null,
      })
      .select("*")
      .single();
    if (error) throw new AppError("Could not save diet check-in.", { cause: error });
    return data;
  }

  async daysSinceLastCheckIn(petId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from("diet_check_ins")
      .select("check_in_date")
      .eq("pet_id", petId)
      .order("check_in_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data?.check_in_date) return null;
    const last = new Date(data.check_in_date);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  }
}
