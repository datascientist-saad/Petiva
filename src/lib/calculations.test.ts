import { describe, expect, it } from "vitest";
import {
  calculatePetAge,
  daysUntilVaccination,
  foodConsumedToday,
  isVaccinationDueSoon,
  isVaccinationOverdue,
  remainingFoodTarget,
  userCanAccessPet,
  weeklyCareCompletionPercent,
  weightDifference,
} from "@/lib/calculations";
import type { CareTask, MealLog, TaskCompletion, WeightRecord } from "@/types/database";

describe("calculatePetAge", () => {
  it("computes age from birth date", () => {
    const now = new Date("2026-03-23");
    const age = calculatePetAge({ birth_date: "2023-03-23", estimated_age_months: null }, now);
    expect(age.years).toBe(3);
    expect(age.label).toContain("3");
  });

  it("uses estimated months when DOB missing", () => {
    const age = calculatePetAge({ birth_date: null, estimated_age_months: 18 }, new Date("2026-01-01"));
    expect(age.years).toBe(1);
    expect(age.months).toBe(6);
  });
});

describe("vaccination logic", () => {
  const now = new Date("2026-03-23");

  it("detects overdue vaccinations", () => {
    expect(
      isVaccinationOverdue({ next_due_date: "2026-03-01", status: "upcoming" }, now)
    ).toBe(true);
  });

  it("detects due soon vaccinations", () => {
    expect(
      isVaccinationDueSoon({ next_due_date: "2026-03-30", status: "upcoming" }, 14, now)
    ).toBe(true);
    expect(
      isVaccinationDueSoon({ next_due_date: "2026-05-01", status: "upcoming" }, 14, now)
    ).toBe(false);
  });

  it("counts days until vaccination", () => {
    expect(daysUntilVaccination("2026-04-02", now)).toBe(10);
  });
});

describe("weeklyCareCompletionPercent", () => {
  it("calculates completion from scheduled tasks", () => {
    const tasks = [
      { id: "1", active: true, frequency: "daily" },
      { id: "2", active: true, frequency: "weekly" },
    ] as CareTask[];
    const completions = Array.from({ length: 4 }).map((_, i) => ({
      id: String(i),
      care_task_id: "1",
      pet_id: "p",
      completed_at: "2026-03-23T10:00:00.000Z",
      completed_by: null,
      notes: null,
    })) as TaskCompletion[];
    const pct = weeklyCareCompletionPercent(tasks, completions, new Date("2026-03-23"));
    // expected = 7 daily + 1 weekly = 8; done = 4 => 50%
    expect(pct).toBe(50);
  });
});

describe("weightDifference", () => {
  it("returns current previous and diff", () => {
    const records = [
      { weight_kg: 4.5, recorded_at: "2026-01-01" },
      { weight_kg: 4.8, recorded_at: "2026-03-01" },
    ] as WeightRecord[];
    const result = weightDifference(records);
    expect(result.current).toBe(4.8);
    expect(result.previous).toBe(4.5);
    expect(result.diff).toBeCloseTo(0.3);
  });
});

describe("foodConsumedToday", () => {
  it("sums today's meals in matching unit", () => {
    const now = new Date("2026-03-23T15:00:00");
    const meals = [
      { amount: 40, unit: "grams", logged_at: "2026-03-23T08:00:00" },
      { amount: 20, unit: "grams", logged_at: "2026-03-23T12:00:00" },
      { amount: 1, unit: "cans", logged_at: "2026-03-23T12:00:00" },
      { amount: 50, unit: "grams", logged_at: "2026-03-22T12:00:00" },
    ] as MealLog[];
    expect(foodConsumedToday(meals, "grams", now)).toBe(60);
    expect(remainingFoodTarget(60, 80)).toBe(20);
  });
});

describe("userCanAccessPet", () => {
  it("allows owner and accepted caregivers only", () => {
    const pet = { owner_id: "owner-1" };
    expect(userCanAccessPet("owner-1", pet, [])).toBe(true);
    expect(
      userCanAccessPet("care-1", pet, [
        { user_id: "care-1", role: "caregiver", accepted_at: "2026-01-01" },
      ])
    ).toBe(true);
    expect(
      userCanAccessPet("care-2", pet, [
        { user_id: "care-2", role: "caregiver", accepted_at: null },
      ])
    ).toBe(false);
    expect(userCanAccessPet("stranger", pet, [])).toBe(false);
  });
});
