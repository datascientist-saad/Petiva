import { describe, expect, it } from "vitest";
import { calculateBirdNutrition, gramsFromKg, kgFromGrams } from "./bird-calculator";

describe("bird nutrition calculator", () => {
  it("converts weight units", () => {
    expect(gramsFromKg(0.045)).toBe(45);
    expect(kgFromGrams(45)).toBeCloseTo(0.045);
  });

  it("returns structured composition guidance", () => {
    const result = calculateBirdNutrition({
      birdSpecies: "Budgie",
      weightGrams: 35,
      ageMonths: 18,
      activityLevel: "moderate",
    });
    expect(result.engineVersion).toBe("bird-v1");
    expect(result.suggestedPelletPercent.min).toBeGreaterThan(0);
    expect(result.unsafeFoodWarnings.length).toBeGreaterThan(0);
    expect(result.personalBaselineGrams).toBe(35);
  });

  it("does not reuse dog or cat calorie formulas", () => {
    const result = calculateBirdNutrition({
      birdSpecies: "Cockatiel",
      weightGrams: 350,
      ageMonths: 24,
      activityLevel: "moderate",
    });
    expect(result.calorieCalculationAvailable).toBe(false);
    expect(result.feedingQuantityAvailable).toBe(false);
    expect(result).not.toHaveProperty("merKcal");
    expect(result).not.toHaveProperty("rerKcal");
    expect(result.limitations.join(" ")).toMatch(/calorie or feeding-quantity calculation is not yet available/i);
    expect(result.avianVetDisclaimer).toMatch(/avian veterinarian/i);
  });

  it("flags avian vet review for egg laying", () => {
    const result = calculateBirdNutrition({
      birdSpecies: "Cockatiel",
      weightGrams: 90,
      ageMonths: 24,
      activityLevel: "low",
      eggLaying: true,
    });
    expect(result.elevatedVetWarning).toBe(true);
  });
});
