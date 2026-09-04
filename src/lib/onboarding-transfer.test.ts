import { describe, expect, it } from "vitest";
import { draftToWeightGrams, draftToWeightKg } from "@/lib/onboarding-draft";
import { AppError } from "@/lib/errors";
import { buildPetPayloadFromDraft, transferOnboardingDraft } from "@/lib/onboarding-transfer";
import { initialOnboardingDraft } from "@/types/onboarding-draft";

function birdDraft() {
  const draft = initialOnboardingDraft();
  draft.name = "Kiwi";
  draft.species = "bird";
  draft.breed = "Budgie";
  draft.species_profile.bird_species = "Budgie";
  draft.use_approximate_age = true;
  draft.life_stage = "adult";
  draft.weight_value = "350";
  draft.weight_unit = "g";
  draft.activity_level = "moderate";
  draft.species_profile.pellet_percent = "70";
  draft.species_profile.vegetable_percent = "20";
  draft.species_profile.seed_percent = "5";
  draft.species_profile.fruit_percent = "5";
  return draft;
}

describe("bird onboarding payload", () => {
  it("stores grams plus a kilogram conversion and does not send mammal-only diet fields", () => {
    const payload = buildPetPayloadFromDraft(birdDraft(), "user-1");
    expect(payload.species).toBe("bird");
    expect(payload.weight_unit).toBe("g");
    expect(payload.weight_grams).toBe(350);
    expect(payload.weight_kg).toBeCloseTo(0.35, 5);
    expect(payload.breed).toBe("Budgie");
    expect(payload.body_condition).toBeNull();
    expect(payload.diet_goal).toBeNull();
    expect(payload.food_type).toBeNull();
    expect(payload.species_profile).toMatchObject({ bird_species: "Budgie", pellet_percent: "70" });
    expect(draftToWeightKg(birdDraft())).toBeCloseTo(0.35, 5);
    expect(draftToWeightGrams(birdDraft())).toBe(350);
  });

  it("fills a missing species_profile instead of sending null", () => {
    const draft = birdDraft();
    draft.species_profile = null as never;
    const payload = buildPetPayloadFromDraft(draft, "user-1");
    expect(payload.species_profile).toMatchObject({ pellet_percent: "70" });
    expect(payload.species_profile).not.toBeNull();
  });
});

describe("bird onboarding transfer", () => {
  it("still returns the pet when bird nutrition extras fail", async () => {
    const pets: Array<{ id: string; name: string; owner_id: string; role?: string }> = [];
    const created: unknown[] = [];

    const chain = (table: string) => {
      const api: Record<string, unknown> = {
        then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
          resolve({ data: table === "pets" ? pets : [], error: null }),
      };
      const self = () => api;
      api.select = self;
      api.eq = self;
      api.neq = self;
      api.order = self;
      api.limit = self;
      api.maybeSingle = async () => ({ data: pets[0] ?? null, error: null });
      api.single = async () => ({ data: pets[0] ?? { id: "pet-bird", name: "Kiwi" }, error: null });
      api.upsert = async () => {
        if (table === "nutrition_profiles") {
          throw new AppError("Could not save nutrition profile.", {
            cause: { message: "Could not find the 'engine_type' column" },
          });
        }
        return { error: null };
      };
      api.insert = (row: { name?: string }) => {
        if (table === "pets" && row.name) {
          created.push(row);
          pets.push({ id: "pet-bird", name: row.name, owner_id: "user-1", role: "owner" });
        }
        if (table === "diet_plans") {
          return {
            ...api,
            select: () => ({
              ...api,
              single: async () => ({
                data: null,
                error: { message: "Could not find the 'engine_type' column of 'diet_plans'" },
              }),
            }),
          };
        }
        return api;
      };
      api.update = self;
      api.delete = self;
      return api;
    };

    const supabase = { from: (table: string) => chain(table) };
    const user = { id: "user-1", email: "owner@example.com", user_metadata: { full_name: "Owner" } };
    const result = await transferOnboardingDraft(supabase as never, user as never, birdDraft());
    expect(result.petName).toBe("Kiwi");
    expect(result.petId).toBe("pet-bird");
    expect(created).toHaveLength(1);
    expect((created[0] as { species: string }).species).toBe("bird");
  });
});
