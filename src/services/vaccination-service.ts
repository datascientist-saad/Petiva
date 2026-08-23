import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { resolveVaccinationStatus } from "@/lib/calculations";
import type { Vaccination } from "@/types/database";

export class VaccinationService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string): Promise<Vaccination[]> {
    const { data, error } = await this.supabase
      .from("vaccinations")
      .select("*")
      .eq("pet_id", petId)
      .order("next_due_date", { ascending: true, nullsFirst: false });
    if (error) throw new AppError("Could not load vaccinations.", { cause: error });
    return (data ?? []).map((v) => ({
      ...v,
      status: resolveVaccinationStatus(v),
    }));
  }

  async create(petId: string, input: Omit<Partial<Vaccination>, "id" | "pet_id"> & { name: string }) {
    const status = resolveVaccinationStatus({
      next_due_date: input.next_due_date ?? null,
      status: input.status ?? "upcoming",
      administered_date: input.administered_date ?? null,
    });
    const { data, error } = await this.supabase
      .from("vaccinations")
      .insert({ ...input, pet_id: petId, status })
      .select("*")
      .single();
    if (error) throw new AppError("Could not save vaccination.", { cause: error });
    return data as Vaccination;
  }

  async update(id: string, input: Partial<Vaccination>) {
    const status =
      input.next_due_date !== undefined || input.status !== undefined
        ? resolveVaccinationStatus({
            next_due_date: input.next_due_date ?? null,
            status: input.status ?? "upcoming",
            administered_date: input.administered_date ?? null,
          })
        : undefined;
    const { data, error } = await this.supabase
      .from("vaccinations")
      .update({ ...input, ...(status ? { status } : {}) })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new AppError("Could not update vaccination.", { cause: error });
    return data as Vaccination;
  }

  async remove(id: string) {
    const { error } = await this.supabase.from("vaccinations").delete().eq("id", id);
    if (error) throw new AppError("Could not delete vaccination.", { cause: error });
  }
}
