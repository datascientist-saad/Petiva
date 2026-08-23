import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import type { Medication } from "@/types/database";

export class MedicationService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string): Promise<Medication[]> {
    const { data, error } = await this.supabase
      .from("medications")
      .select("*")
      .eq("pet_id", petId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("Could not load medications.", { cause: error });
    return data ?? [];
  }

  async create(petId: string, input: Omit<Partial<Medication>, "id" | "pet_id"> & { name: string; dose: string; unit: string; frequency: string; start_date: string }) {
    const { data, error } = await this.supabase
      .from("medications")
      .insert({ ...input, pet_id: petId })
      .select("*")
      .single();
    if (error) throw new AppError("Could not save medication.", { cause: error });
    return data as Medication;
  }

  async update(id: string, input: Partial<Medication>) {
    const { data, error } = await this.supabase
      .from("medications")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new AppError("Could not update medication.", { cause: error });
    return data as Medication;
  }

  async remove(id: string) {
    const { error } = await this.supabase.from("medications").delete().eq("id", id);
    if (error) throw new AppError("Could not delete medication.", { cause: error });
  }
}
