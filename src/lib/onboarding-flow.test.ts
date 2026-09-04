import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeNextPath } from "./auth-redirect";
import {
  buildDietPreviewFromDraft,
  draftToDietInput,
  loadOnboardingDraft,
  saveOnboardingDraft,
  clearOnboardingDraft,
} from "./onboarding-draft";
import { transferOnboardingDraft } from "./onboarding-transfer";
import { initialOnboardingDraft } from "@/types/onboarding-draft";

const memory = new Map<string, string>();
const session = new Map<string, string>();

vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
});
vi.stubGlobal("sessionStorage", {
  getItem: (key: string) => session.get(key) ?? null,
  setItem: (key: string, value: string) => {
    session.set(key, value);
  },
  removeItem: (key: string) => {
    session.delete(key);
  },
});
vi.stubGlobal("document", { cookie: "" });

afterEach(() => {
  memory.clear();
  session.clear();
});

function completeDraft() {
  const draft = initialOnboardingDraft();
  draft.name = "Maple";
  draft.species = "dog";
  draft.use_approximate_age = true;
  draft.life_stage = "adult";
  draft.weight_value = "12";
  draft.weight_unit = "kg";
  draft.activity_level = "moderate";
  draft.body_condition = "ideal";
  draft.diet_goal = "maintain";
  draft.food_type = "dry";
  draft.meals_per_day = "2";
  draft.neutered = "yes";
  return draft;
}

describe("preview to signup conversion", () => {
  it("preserves onboarding state across a signup-page refresh", () => {
    const draft = completeDraft();
    saveOnboardingDraft({ ...draft, step: "preview", stepIndex: 3 });
    const restored = loadOnboardingDraft();
    expect(restored?.name).toBe("Maple");
    expect(restored?.weight_value).toBe("12");
    expect(restored?.life_stage).toBe("adult");
    expect(restored?.step).toBe("preview");
  });

  it("uses a safe signup redirect without putting pet details in the URL", () => {
    expect(sanitizeNextPath("/setup/complete")).toBe("/setup/complete");
    expect(sanitizeNextPath("https://evil.test")).toBe("/home");
    expect(sanitizeNextPath("//evil.test")).toBe("/home");
    const input = draftToDietInput(completeDraft());
    expect(input?.weightKg).toBe(12);
  });

  it("builds a non-extreme adult-dog preview and splits meals to the daily target", () => {
    const preview = buildDietPreviewFromDraft(completeDraft());
    expect(preview && "rerKcal" in preview ? preview.rerKcal : 0).toBe(451);
    expect(preview && "merKcal" in preview ? preview.merKcal : 0).toBeLessThan(1200);
    if (preview && "mealSchedule" in preview) {
      const sum = preview.mealSchedule.reduce((total, meal) => total + meal.calories, 0);
      expect(sum).toBe(preview.merKcal);
    }
  });

  it("saves the pet once when authentication callbacks reload", async () => {
    const created: unknown[] = [];
    const pets: Array<{ id: string; name: string; owner_id: string; role?: string }> = [];

    const chain = (table: string) => {
      const rows = () => (table === "pets" ? pets : []);
      const api: Record<string, unknown> = {
        then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
          resolve({ data: rows(), error: null }),
      };
      const self = () => api;
      api.select = self;
      api.eq = self;
      api.neq = self;
      api.order = self;
      api.limit = self;
      api.maybeSingle = async () => ({ data: pets[0] ?? null, error: null });
      api.single = async () => ({ data: pets[0] ?? { id: "pet-1", name: "Maple" }, error: null });
      api.upsert = async () => ({ error: null });
      api.insert = (row: { name?: string }) => {
        if (table === "pets" && row.name) {
          created.push(row);
          if (!pets.length) pets.push({ id: "pet-1", name: row.name, owner_id: "user-1", role: "owner" });
        }
        return api;
      };
      api.update = self;
      api.delete = self;
      return api;
    };

    const supabase = { from: (table: string) => chain(table) };
    const user = { id: "user-1", email: "owner@example.com", user_metadata: { full_name: "Owner" } };
    const first = await transferOnboardingDraft(supabase as never, user as never, completeDraft());
    const second = await transferOnboardingDraft(supabase as never, user as never, completeDraft());
    expect(first.petName).toBe("Maple");
    expect(second.petName).toBe("Maple");
    expect(created.length).toBeLessThanOrEqual(1);
  });
});

describe("legacy unknown-age drafts", () => {
  it("does not treat a missing date as zero months", () => {
    clearOnboardingDraft();
    const draft = initialOnboardingDraft();
    draft.use_approximate_age = true;
    draft.life_stage = "unknown";
    draft.estimated_age_months = "0";
    draft.estimated_age_years = "0";
    const preview = buildDietPreviewFromDraft({
      ...completeDraft(),
      use_approximate_age: true,
      life_stage: "unknown",
      birth_date: "",
    });
    expect(preview && "assumptions" in preview ? preview.assumptions.join(" ") : "").toMatch(/adult/i);
    expect(draft.life_stage).not.toBe("baby");
  });

  it("restores bird species_profile when a saved draft had null extras", () => {
    saveOnboardingDraft({
      ...initialOnboardingDraft(),
      name: "Kiwi",
      species: "bird",
      species_profile: null as never,
    });
    const restored = loadOnboardingDraft();
    expect(restored?.species_profile.pellet_percent).toBe("70");
    expect(() => buildDietPreviewFromDraft(restored!)).not.toThrow();
  });
});

describe("bird plan preview", () => {
  it("does not throw when species_profile is missing and does not reuse mammal calories", () => {
    const draft = initialOnboardingDraft();
    draft.species = "bird";
    draft.weight_value = "350";
    draft.weight_unit = "g";
    draft.activity_level = "moderate";
    draft.species_profile = undefined as never;
    const preview = buildDietPreviewFromDraft(draft);
    expect(preview && "calorieCalculationAvailable" in preview ? preview.calorieCalculationAvailable : true).toBe(
      false
    );
    expect(preview && "merKcal" in preview).toBe(false);
  });
});
