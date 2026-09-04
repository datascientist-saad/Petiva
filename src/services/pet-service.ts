import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, logError } from "@/lib/errors";
import { nextPetWriteAttempt, stripOptionalPetInsertColumns } from "@/lib/pet-write";
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
    // Production is missing pets.life_stage until that migration is applied.
    // Insert the core row first, then patch optional columns if the schema has them.
    const { core, extra } = stripOptionalPetInsertColumns({ ...input } as Record<string, unknown>);
    let attempt: Record<string, unknown> = core;
    let lastError: unknown = null;

    for (let round = 0; round < 8; round += 1) {
      const { error } = await this.supabase.from("pets").insert(attempt);
      if (!error) {
        lastError = null;
        break;
      }
      lastError = error;
      const next = nextPetWriteAttempt(attempt, error);
      if (!next || Object.keys(next).length === 0) break;
      attempt = next;
    }

    if (lastError) {
      throw new AppError(`Something went wrong while creating ${input.name}'s profile.`, { cause: lastError });
    }

    const { data, error: fetchError } = await this.supabase
      .from("pets")
      .select("*")
      .eq("owner_id", input.owner_id)
      .eq("name", input.name)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !data) {
      throw new AppError(`Something went wrong while creating ${input.name}'s profile.`, {
        cause: fetchError ?? new Error("Pet was created but could not be loaded."),
      });
    }

    const extraKeys = Object.keys(extra).filter((key) => extra[key] !== undefined);
    if (extraKeys.length === 0) return data as Pet;

    try {
      return await this.update(data.id, extra as Partial<Pet>);
    } catch (error) {
      logError("pet-optional-columns", error);
      return data as Pet;
    }
  }

  async update(petId: string, input: Partial<Pet>) {
    let attempt: Record<string, unknown> = { ...input };
    let lastError: unknown = null;
    let data: Pet | null = null;

    for (let round = 0; round < 8; round += 1) {
      if (Object.keys(attempt).length === 0) break;
      const result = await this.supabase.from("pets").update(attempt).eq("id", petId).select("*").single();
      if (!result.error) {
        data = result.data as Pet;
        lastError = null;
        break;
      }
      lastError = result.error;
      const next = nextPetWriteAttempt(attempt, result.error);
      if (!next || Object.keys(next).length === 0) break;
      attempt = next;
    }

    if (lastError || !data) {
      throw new AppError("Could not update pet profile.", { cause: lastError });
    }
    return data;
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
