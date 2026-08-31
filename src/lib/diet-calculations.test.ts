import { describe, expect, it } from "vitest";
import {
  calculateDietPlan,
  calculateRER,
  kgFromLb,
  lbFromKg,
  validateMixedFeedingPercent,
} from "./diet-calculations";
import {
  buildDietPreviewFromDraft,
  draftToWeightKg,
} from "./onboarding-draft";
import { initialOnboardingDraft } from "@/types/onboarding-draft";

describe("diet-calculations", () => {
  const baseInput = {
    species: "dog" as const,
    weightKg: 10,
    ageMonths: 36,
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

  it("calculates dry and wet portions for mixed feeding", () => {
    const result = calculateDietPlan({
      ...baseInput,
      foodType: "mixed",
      mixedDryPercent: 60,
      caloriesPer100g: 360,
    });
    expect(result.dryFoodGrams).toBeGreaterThan(0);
    expect(result.wetFoodGrams).toBeGreaterThan(0);
  });

  it("marks estimates when calorie density is missing", () => {
    const result = calculateDietPlan({ ...baseInput, caloriesPer100g: null });
    expect(result.isEstimate).toBe(true);
    expect(result.dailyFoodGrams).toBeGreaterThan(0);
  });

  it("elevates vet warning for puppies", () => {
    const result = calculateDietPlan({ ...baseInput, ageMonths: 3 });
    expect(result.elevatedVetWarning).toBe(true);
  });

  it("includes influencing factors", () => {
    const result = calculateDietPlan(baseInput);
    expect(result.influencingFactors.length).toBeGreaterThan(0);
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
    draft.weight_value = "4.2";
    draft.weight_unit = "kg";
    draft.activity_level = "moderate";
    draft.body_condition = "ideal";
    draft.diet_goal = "maintain";
    draft.food_type = "wet";
    draft.meals_per_day = "2";
    draft.calories_per_100g = "85";

    const preview = buildDietPreviewFromDraft(draft);
    expect(preview).not.toBeNull();
    expect(preview && "merKcalMin" in preview ? preview.merKcalMin : 0).toBeGreaterThan(0);
  });
});
