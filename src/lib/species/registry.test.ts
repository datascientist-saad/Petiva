import { describe, expect, it } from "vitest";
import {
  getSpeciesDefinition,
  isSupportedSpecies,
  speciesUsesBirdNutrition,
  speciesUsesMammalNutrition,
  SUPPORTED_SPECIES,
} from "./registry";

describe("species registry", () => {
  it("lists three supported species", () => {
    expect(SUPPORTED_SPECIES.map((s) => s.id)).toEqual(["cat", "dog", "bird"]);
  });

  it("routes nutrition engines correctly", () => {
    expect(speciesUsesMammalNutrition("cat")).toBe(true);
    expect(speciesUsesBirdNutrition("bird")).toBe(true);
    expect(speciesUsesMammalNutrition("bird")).toBe(false);
  });

  it("marks future species unsupported", () => {
    expect(isSupportedSpecies("rabbit")).toBe(false);
    expect(getSpeciesDefinition("rabbit").nutritionEngine).toBe("none");
  });

  it("defaults unknown species to cat definition", () => {
    expect(getSpeciesDefinition("unknown").id).toBe("cat");
  });
});
