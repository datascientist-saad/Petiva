import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import type { MedicalRecord, Symptom } from "@/types/database";

export class HealthRecordService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string): Promise<MedicalRecord[]> {
    const { data, error } = await this.supabase
      .from("medical_records")
      .select("*")
      .eq("pet_id", petId)
      .order("record_date", { ascending: false });
    if (error) throw new AppError("Could not load medical records.", { cause: error });
    return data ?? [];
  }

  async create(
    petId: string,
    userId: string,
    input: Omit<Partial<MedicalRecord>, "id" | "pet_id"> & {
      title: string;
      record_type: MedicalRecord["record_type"];
      record_date: string;
    }
  ) {
    const { data, error } = await this.supabase
      .from("medical_records")
      .insert({ ...input, pet_id: petId, created_by: userId })
      .select("*")
      .single();
    if (error) throw new AppError("Could not save medical record.", { cause: error });
    return data as MedicalRecord;
  }

  async update(id: string, input: Partial<MedicalRecord>) {
    const { data, error } = await this.supabase
      .from("medical_records")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new AppError("Could not update medical record.", { cause: error });
    return data as MedicalRecord;
  }

  async remove(id: string) {
    const { error } = await this.supabase.from("medical_records").delete().eq("id", id);
    if (error) throw new AppError("Could not delete medical record.", { cause: error });
  }

  async getSignedUrl(path: string) {
    const { data, error } = await this.supabase.storage
      .from("medical-files")
      .createSignedUrl(path, 60 * 10);
    if (error) throw new AppError("Could not open this file.", { cause: error });
    return data.signedUrl;
  }
}

export class SymptomService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string): Promise<Symptom[]> {
    const { data, error } = await this.supabase
      .from("symptoms")
      .select("*")
      .eq("pet_id", petId)
      .order("started_at", { ascending: false });
    if (error) throw new AppError("Could not load symptoms.", { cause: error });
    return data ?? [];
  }

  async create(
    petId: string,
    userId: string,
    input: {
      symptom: string;
      severity: Symptom["severity"];
      started_at: string;
      description?: string | null;
      image_url?: string | null;
      status?: Symptom["status"];
    }
  ) {
    const { data, error } = await this.supabase
      .from("symptoms")
      .insert({
        ...input,
        pet_id: petId,
        created_by: userId,
        status: input.status ?? "active",
      })
      .select("*")
      .single();
    if (error) throw new AppError("Could not save symptom.", { cause: error });
    return data as Symptom;
  }

  async resolve(id: string) {
    const { data, error } = await this.supabase
      .from("symptoms")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new AppError("Could not update symptom.", { cause: error });
    return data as Symptom;
  }

  async remove(id: string) {
    const { error } = await this.supabase.from("symptoms").delete().eq("id", id);
    if (error) throw new AppError("Could not delete symptom.", { cause: error });
  }
}
