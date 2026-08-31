import { describe, expect, it } from "vitest";
import { formatPetWeight, formatWeightRecord } from "./weight";
import type { Pet } from "@/types/database";

describe("weight units", () => {
  it("formats bird weight in grams", () => {
    const pet = {
      species: "bird",
      weight_kg: 0.045,
      weight_grams: 45,
    } as Pick<Pet, "species" | "weight_kg" | "weight_grams">;
    expect(formatPetWeight(pet)).toBe("45 g");
  });

  it("formats dog weight in kg", () => {
    const pet = {
      species: "dog",
      weight_kg: 12.5,
      weight_grams: null,
    } as Pick<Pet, "species" | "weight_kg" | "weight_grams">;
    expect(formatPetWeight(pet)).toBe("12.5 kg");
  });

  it("formats weight records for birds as grams", () => {
    expect(formatWeightRecord("bird", { weight_kg: 0.038 })).toBe("38 g");
  });
});
