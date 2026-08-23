import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import type { Allergy, Condition, Pet, PetWithDetails } from "@/types/database";

export class PetService {
  constructor(private supabase: SupabaseClient) {}

  async listForUser(userId: string): Promise<PetWithDetails[]> {
    const { data: owned, error: ownedError } = await this.supabase
      .from("pets")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });

    if (ownedError) throw new AppError("Could not load your pets.", { cause: ownedError });

    const { data: access, error: accessError } = await this.supabase
      .from("pet_access")
      .select("pet_id, role, pets(*)")
      .eq("user_id", userId)
      .neq("role", "owner");

    if (accessError) throw new AppError("Could not load shared pets.", { cause: accessError });

    const shared = (access ?? [])
      .filter((row) => row.pets)
      .map((row) => ({ ...(row.pets as unknown as Pet), role: row.role as "caregiver" }));

    const pets = [...(owned ?? []).map((p) => ({ ...p, role: "owner" as const })), ...shared];
    const unique = new Map(pets.map((p) => [p.id, p]));
    const list = Array.from(unique.values());

    const withDetails = await Promise.all(
      list.map(async (pet) => {
        const [conditions, allergies] = await Promise.all([
          this.listConditions(pet.id),
          this.listAllergies(pet.id),
        ]);
        return { ...pet, conditions, allergies };
      })
    );

    return withDetails;
  }

  async getById(petId: string): Promise<PetWithDetails | null> {
    const { data, error } = await this.supabase.from("pets").select("*").eq("id", petId).maybeSingle();
    if (error) throw new AppError("Could not load this pet.", { cause: error });
    if (!data) return null;
    const [conditions, allergies] = await Promise.all([
      this.listConditions(petId),
      this.listAllergies(petId),
    ]);
    return { ...data, conditions, allergies };
  }

  async create(input: Partial<Pet> & { name: string; species: string; owner_id: string }) {
    const { data, error } = await this.supabase.from("pets").insert(input).select("*").single();
    if (error) throw new AppError(`Something went wrong while creating ${input.name}'s profile.`, { cause: error });
    return data as Pet;
  }

  async update(petId: string, input: Partial<Pet>) {
    const { data, error } = await this.supabase
      .from("pets")
      .update(input)
      .eq("id", petId)
      .select("*")
      .single();
    if (error) throw new AppError("Could not update pet profile.", { cause: error });
    return data as Pet;
  }

  async delete(petId: string) {
    const { error } = await this.supabase.from("pets").delete().eq("id", petId);
    if (error) throw new AppError("Could not delete this pet.", { cause: error });
  }

  async listConditions(petId: string): Promise<Condition[]> {
    const { data, error } = await this.supabase.from("conditions").select("*").eq("pet_id", petId);
    if (error) throw new AppError("Could not load health conditions.", { cause: error });
    return data ?? [];
  }

  async listAllergies(petId: string): Promise<Allergy[]> {
    const { data, error } = await this.supabase.from("allergies").select("*").eq("pet_id", petId);
    if (error) throw new AppError("Could not load allergies.", { cause: error });
    return data ?? [];
  }

  async replaceConditions(petId: string, names: string[]) {
    await this.supabase.from("conditions").delete().eq("pet_id", petId);
    if (!names.length) return [];
    const { data, error } = await this.supabase
      .from("conditions")
      .insert(names.map((name) => ({ pet_id: petId, name })))
      .select("*");
    if (error) throw new AppError("Could not save health conditions.", { cause: error });
    return data ?? [];
  }

  async replaceAllergies(petId: string, names: string[]) {
    await this.supabase.from("allergies").delete().eq("pet_id", petId);
    if (!names.length) return [];
    const { data, error } = await this.supabase
      .from("allergies")
      .insert(names.map((name) => ({ pet_id: petId, name })))
      .select("*");
    if (error) throw new AppError("Could not save allergies.", { cause: error });
    return data ?? [];
  }
}
