import { describe, expect, it } from "vitest";
import { evaluateWellnessInsights, pickTopInsight } from "./insight-rules";
import type { Pet, Vaccination, WeightRecord } from "@/types/database";

const basePet: Pet = {
  id: "p1",
  owner_id: "u1",
  name: "Kiwi",
  species: "bird",
  breed: "Budgie",
  birth_date: null,
  estimated_age_months: 12,
  life_stage: "adult",
  sex: "unknown",
  neutered: "unknown",
  weight_kg: 0.035,
  weight_grams: 35,
  weight_unit: "g",
  profile_image_url: null,
  activity_level: "moderate",
  activity_level_extended: null,
  body_condition: null,
  diet_goal: null,
  food_type: null,
  food_brand: null,
  food_product: null,
  meals_per_day: null,
  calories_per_100g: null,
  calories_per_serving: null,
  mixed_feeding_dry_percent: null,
  foods_to_avoid: null,
  vet_diet_notes: null,
  daily_food_target: null,
  food_unit: "grams",
  onboarding_completed: true,
  species_profile: {},
  primary_goal: null,
  calculation_version: null,
  created_at: "",
  updated_at: "",
};

describe("insight rules", () => {
  it("prioritizes vet_review over attention", () => {
    const top = pickTopInsight([
      {
        insightType: "a",
        severity: "attention",
        title: "A",
        body: "a",
        requiresVetReview: false,
        sourceData: {},
      },
      {
        insightType: "b",
        severity: "vet_review",
        title: "B",
        body: "b",
        requiresVetReview: true,
        sourceData: {},
      },
    ]);
    expect(top?.severity).toBe("vet_review");
  });

  it("flags overdue vaccinations", () => {
    const vax: Vaccination = {
      id: "v1",
      pet_id: "p1",
      name: "Rabies",
      administered_date: "2024-01-01",
      next_due_date: "2024-06-01",
      clinic: null,
      veterinarian: null,
      notes: null,
      attachment_url: null,
      status: "overdue",
      created_at: "",
      updated_at: "",
    };
    const insights = evaluateWellnessInsights({
      pet: basePet,
      weightRecords: [],
      vaccinations: [vax],
      tasks: [],
      completions: [],
      dietPlan: null,
      now: new Date("2026-08-31"),
    });
    expect(insights.some((i) => i.insightType === "vaccination_overdue")).toBe(true);
  });

  it("suggests bird weight baseline when no records", () => {
    const insights = evaluateWellnessInsights({
      pet: basePet,
      weightRecords: [],
      vaccinations: [],
      tasks: [],
      completions: [],
      dietPlan: null,
    });
    expect(insights.some((i) => i.insightType === "bird_weight_baseline")).toBe(true);
  });

  it("detects meaningful weight change", () => {
    const records: WeightRecord[] = [
      {
        id: "w1",
        pet_id: "p1",
        weight_kg: 4,
        recorded_at: "2026-08-01T10:00:00Z",
        notes: null,
        created_by: null,
        created_at: "",
      },
      {
        id: "w2",
        pet_id: "p1",
        weight_kg: 4.5,
        recorded_at: "2026-08-10T10:00:00Z",
        notes: null,
        created_by: null,
        created_at: "",
      },
    ];
    const insights = evaluateWellnessInsights({
      pet: { ...basePet, species: "dog" },
      weightRecords: records,
      vaccinations: [],
      tasks: [],
      completions: [],
      dietPlan: null,
      now: new Date("2026-08-31"),
    });
    expect(insights.some((i) => i.insightType === "weight_trend")).toBe(true);
  });
});
