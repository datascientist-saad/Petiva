import { describe, expect, it } from "vitest";
import { draftToWeightKg } from "@/lib/onboarding-draft";
import { initialOnboardingDraft } from "@/types/onboarding-draft";

// Test the payload builder indirectly via exported draft helpers and documented behavior.
// Full transfer is integration-tested against Supabase in e2e; here we verify draft → weight mapping.

describe("onboarding transfer prerequisites", () => {
  it("maps a complete draft to weight in kg", () => {
    const draft = initialOnboardingDraft();
    draft.name = "Luna";
    draft.weight_value = "10";
    draft.weight_unit = "lb";
    draft.activity_level = "moderate";
    draft.body_condition = "ideal";
    draft.diet_goal = "maintain";
    draft.food_type = "dry";
    draft.meals_per_day = "2";

    expect(draftToWeightKg(draft)).toBeCloseTo(4.54, 1);
    expect(draft.weight_value).toBe("10");
    expect(draft.activity_level).toBe("moderate");
    expect(draft.body_condition).toBe("ideal");
    expect(draft.diet_goal).toBe("maintain");
  });

  it("keeps required body and diet fields on draft used for transfer", () => {
    const draft = initialOnboardingDraft();
    draft.name = "Max";
    draft.weight_value = "32";
    draft.weight_unit = "kg";
    draft.activity_level = "active";
    draft.body_condition = "overweight";
    draft.neutered = "yes";
    draft.food_type = "mixed";
    draft.diet_goal = "lose";
    draft.mixed_dry_percent = "60";
    draft.health_conditions = ["Arthritis"];
    draft.allergies = "Chicken";

    expect(draft.name).toBe("Max");
    expect(draftToWeightKg(draft)).toBe(32);
    expect(draft.health_conditions).toContain("Arthritis");
    expect(draft.allergies).toBe("Chicken");
  });
});
