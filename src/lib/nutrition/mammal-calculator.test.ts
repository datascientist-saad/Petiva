import { describe, expect, it } from "vitest";
import { HIGH_RISK_ESCALATION } from "./constants";
import {
  buildMealSchedule,
  calculateDietPlan,
  calculateRER,
  kgFromLb,
  lbFromKg,
  splitDailyCalories,
  validateMammalWeight,
  type DietCalculationInput,
} from "./mammal-calculator";

const adultDog: DietCalculationInput = {
  species: "dog",
  weightKg: 12,
  lifeStage: "adult",
  neutered: "no",
  activityLevel: "moderate",
  bodyCondition: "ideal",
  dietGoal: "maintain",
  foodType: "dry",
  mealsPerDay: 2,
  caloriesPer100g: 360,
};

describe("RER", () => {
  it("starts a 12 kg adult dog at approximately 451 kcal/day", () => {
    const rer = calculateRER(12);
    expect(rer).toBeCloseTo(451, 0);
    expect(rer).toBeGreaterThan(440);
    expect(rer).toBeLessThan(460);
  });
});

describe("calculateDietPlan", () => {
  it("calculates a sensible adult-dog maintenance estimate from RER", () => {
    const result = calculateDietPlan(adultDog);
    expect(result.rerKcal).toBe(451);
    expect(result.recommendationBlocked).toBe(false);
    expect(result.merKcal).toBeGreaterThan(600);
    expect(result.merKcal).toBeLessThan(1000);
    expect(result.merKcal).toBe(Math.round(451 * 1.8));
    expect(result.isEstimate).toBe(true);
    expect(result.safetyNotice.toLowerCase()).toContain("estimate");
    expect(result.influencingFactors.length).toBeGreaterThan(0);
  });

  it("uses a lower factor for a neutered adult dog", () => {
    const intact = calculateDietPlan(adultDog);
    const neutered = calculateDietPlan({ ...adultDog, neutered: "yes" });
    expect(neutered.merKcal).toBeLessThan(intact.merKcal);
    expect(neutered.merKcal).toBe(Math.round(451 * 1.6));
  });

  it("applies a puppy factor only when the life stage is explicit", () => {
    const puppy = calculateDietPlan({ ...adultDog, lifeStage: "baby", birthDate: null });
    expect(puppy.merKcal).toBe(Math.round(calculateRER(12) * 3.0));
    expect(puppy.elevatedVetWarning).toBe(true);
    expect(puppy.influencingFactors.join(" ")).toMatch(/puppy/i);
  });

  it("does not treat unknown age as a puppy", () => {
    const unknown = calculateDietPlan({
      ...adultDog,
      lifeStage: "unknown",
      birthDate: null,
      ageMonths: 0,
    });
    expect(unknown.merKcal).toBeLessThan(1000);
    expect(unknown.merKcal).not.toBe(Math.round(451 * 3.0));
    expect(unknown.assumptions.some((item) => /adult/i.test(item))).toBe(true);
    expect(unknown.influencingFactors.join(" ")).not.toMatch(/puppy/i);
  });

  it("calculates an adult cat estimate", () => {
    const result = calculateDietPlan({
      ...adultDog,
      species: "cat",
      weightKg: 4.5,
      lifeStage: "adult",
      neutered: "yes",
    });
    const rer = calculateRER(4.5);
    expect(result.rerKcal).toBe(Math.round(rer));
    expect(result.merKcal).toBe(Math.round(rer * 1.2));
  });

  it("applies a kitten factor when the life stage is kitten", () => {
    const result = calculateDietPlan({
      ...adultDog,
      species: "cat",
      weightKg: 1.5,
      lifeStage: "baby",
    });
    expect(result.merKcal).toBe(Math.round(calculateRER(1.5) * 2.5));
    expect(result.elevatedVetWarning).toBe(true);
  });

  it("reduces energy for a weight-loss goal", () => {
    const maintain = calculateDietPlan({ ...adultDog, neutered: "yes" });
    const lose = calculateDietPlan({ ...adultDog, neutered: "yes", dietGoal: "lose" });
    expect(lose.merKcal).toBeLessThan(maintain.merKcal);
    expect(lose.merKcal).toBe(Math.round(maintain.merKcal * 0.8));
  });

  it("increases energy for a weight-gain goal", () => {
    const maintain = calculateDietPlan({ ...adultDog, neutered: "yes" });
    const gain = calculateDietPlan({ ...adultDog, neutered: "yes", dietGoal: "gain" });
    expect(gain.merKcal).toBeGreaterThan(maintain.merKcal);
  });

  it("adjusts an underweight pet and asks for veterinary review", () => {
    const result = calculateDietPlan({
      ...adultDog,
      neutered: "yes",
      bodyCondition: "underweight",
    });
    expect(result.merKcal).toBeGreaterThan(Math.round(451 * 1.6));
    expect(result.elevatedVetWarning).toBe(true);
  });

  it("adjusts an overweight pet and asks for veterinary review", () => {
    const result = calculateDietPlan({
      ...adultDog,
      neutered: "yes",
      bodyCondition: "overweight",
    });
    expect(result.merKcal).toBeLessThan(Math.round(451 * 1.6));
    expect(result.elevatedVetWarning).toBe(true);
  });

  it("blocks routine recommendations for high-risk medical conditions", () => {
    const result = calculateDietPlan({
      ...adultDog,
      conditions: ["Kidney disease"],
    });
    expect(result.recommendationBlocked).toBe(true);
    expect(result.merKcal).toBe(0);
    expect(result.mealSchedule).toEqual([]);
    expect(result.warnings.some((warning) => warning.includes(HIGH_RISK_ESCALATION))).toBe(true);
    expect(result.elevatedVetWarning).toBe(true);
  });

  it("rejects zero weight", () => {
    expect(() => calculateDietPlan({ ...adultDog, weightKg: 0 })).toThrow(/zero/i);
  });

  it("rejects negative weight", () => {
    expect(() => calculateDietPlan({ ...adultDog, weightKg: -4 })).toThrow(/negative/i);
  });

  it("rejects an extremely large or implausible weight", () => {
    expect(() => validateMammalWeight("dog", 250)).toThrow(/plausible/i);
    expect(() => calculateDietPlan({ ...adultDog, weightKg: 250 })).toThrow(/plausible/i);
  });

  it("converts kilograms and pounds consistently", () => {
    expect(kgFromLb(26.455)).toBeCloseTo(12, 2);
    expect(lbFromKg(12)).toBeCloseTo(26.455, 2);
  });

  it.each([1, 2, 3, 4])("divides daily calories across %s meals", (meals) => {
    const result = calculateDietPlan({ ...adultDog, mealsPerDay: meals });
    const sum = result.mealSchedule.reduce((total, meal) => total + meal.calories, 0);
    expect(result.mealSchedule).toHaveLength(meals);
    expect(sum).toBe(result.merKcal);
  });

  it("keeps per-meal rounding consistent with the daily target", () => {
    const parts = splitDailyCalories(723, 2);
    expect(parts.reduce((total, value) => total + value, 0)).toBe(723);
    const schedule = buildMealSchedule(3, 1000);
    expect(schedule.reduce((total, meal) => total + meal.calories, 0)).toBe(1000);
  });

  it("does not invent gram portions without energy density", () => {
    const result = calculateDietPlan({
      ...adultDog,
      caloriesPer100g: null,
      caloriesPerServing: null,
    });
    expect(result.dailyFoodGrams).toBeNull();
    expect(result.assumptions.join(" ")).toMatch(/energy density/i);
  });
});
