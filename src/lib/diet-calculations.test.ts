import { describe, expect, it } from "vitest";
import { calculateDietPlan, calculateRER, kgFromLb, lbFromKg, validateMixedFeedingPercent } from "./diet-calculations";
import { buildDietPreviewFromDraft, draftToWeightKg } from "./onboarding-draft";
// localStorage is used by draft helpers in other suites; this file only uses in-memory drafts.
import { initialOnboardingDraft } from "@/types/onboarding-draft";

describe("diet-calculations compatibility", () => {
  const baseInput = {
    species: "dog" as const,
    weightKg: 10,
    lifeStage: "adult" as const,
    neutered: "yes" as const,
    activityLevel: "moderate" as const,
    bodyCondition: "ideal" as const,
    dietGoal: "maintain" as const,
    foodType: "dry" as const,
    mealsPerDay: 2,
    caloriesPer100g: 360,
  };

  it("calculates RER using weight^0.75", () => {
    expect(calculateRER(10)).toBeGreaterThan(300);
    expect(calculateRER(10)).toBeLessThan(500);
  });

  it("returns a calorie range rather than a single value", () => {
    const result = calculateDietPlan(baseInput);
    expect(result.merKcalMin).toBeLessThan(result.merKcalMax);
    expect(result.merKcalMin).toBeGreaterThan(0);
  });

  it("validates mixed feeding percentages", () => {
    expect(validateMixedFeedingPercent(60, 40)).toBe(true);
    expect(validateMixedFeedingPercent(50, 40)).toBe(false);
  });

  it("converts kg and lb accurately", () => {
    expect(kgFromLb(22.046)).toBeCloseTo(10, 1);
    expect(lbFromKg(10)).toBeCloseTo(22.046, 1);
  });

  it("does not invent grams when calorie density is missing", () => {
    const result = calculateDietPlan({ ...baseInput, caloriesPer100g: null });
    expect(result.isEstimate).toBe(true);
    expect(result.dailyFoodGrams).toBeNull();
  });

  it("elevates vet warning for puppies", () => {
    const result = calculateDietPlan({ ...baseInput, lifeStage: "baby" });
    expect(result.elevatedVetWarning).toBe(true);
  });
});

describe("onboarding draft transformation", () => {
  it("converts lb weight to kg", () => {
    const draft = initialOnboardingDraft();
    draft.weight_value = "22";
    draft.weight_unit = "lb";
    expect(draftToWeightKg(draft)).toBeCloseTo(9.98, 1);
  });

  it("builds diet preview from complete draft", () => {
    const draft = initialOnboardingDraft();
    draft.name = "Luna";
    draft.species = "cat";
    draft.life_stage = "adult";
    draft.use_approximate_age = true;
    draft.weight_value = "4.2";
    draft.weight_unit = "kg";
    draft.activity_level = "moderate";
    draft.body_condition = "ideal";
    draft.diet_goal = "maintain";
    draft.food_type = "wet";
    draft.meals_per_day = "2";
    draft.calories_per_100g = "85";
    draft.calorie_unit = "per_100g";

    const preview = buildDietPreviewFromDraft(draft);
    expect(preview).not.toBeNull();
    expect(preview && "merKcalMin" in preview ? preview.merKcalMin : 0).toBeGreaterThan(0);
  });
});
