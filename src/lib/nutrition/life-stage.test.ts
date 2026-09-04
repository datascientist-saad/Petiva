import { describe, expect, it } from "vitest";
import {
  formatAgeDisplay,
  resolveLifeStage,
} from "./life-stage";

describe("resolveLifeStage", () => {
  it("uses an exact birth date", () => {
    const result = resolveLifeStage({
      species: "dog",
      birthDate: "2023-09-04",
      now: new Date("2026-09-04"),
    });
    expect(result.source).toBe("date_of_birth");
    expect(result.stage).toBe("adult");
    expect(result.ageMonths).toBe(36);
    expect(result.usedJuvenileMultiplier).toBe(false);
  });

  it("uses an explicit approximate life stage", () => {
    const result = resolveLifeStage({
      species: "cat",
      lifeStage: "senior",
      birthDate: null,
    });
    expect(result.source).toBe("explicit");
    expect(result.stage).toBe("senior");
    expect(result.usedJuvenileMultiplier).toBe(false);
  });

  it("uses a conservative adult assumption when age is completely unknown", () => {
    const result = resolveLifeStage({
      species: "dog",
      lifeStage: "unknown",
      birthDate: null,
      estimatedAgeMonths: 0,
    });
    expect(result.stage).toBe("adult");
    expect(result.source).toBe("conservative_adult");
    expect(result.usedJuvenileMultiplier).toBe(false);
    expect(result.assumption).toMatch(/adult/i);
  });
});

describe("formatAgeDisplay", () => {
  it("shows calculated age from a birth date", () => {
    const display = formatAgeDisplay({
      species: "dog",
      birthDate: "2024-09-04",
      now: new Date("2026-09-04"),
    });
    expect(display.label).toContain("2");
    expect(display.totalMonths).toBe(24);
  });

  it("shows Adult instead of 0 months", () => {
    expect(
      formatAgeDisplay({ species: "dog", lifeStage: "adult", birthDate: null }).label
    ).toBe("Adult");
  });

  it("shows Age unknown instead of 0 months", () => {
    expect(
      formatAgeDisplay({
        species: "dog",
        lifeStage: "unknown",
        birthDate: null,
        estimatedAgeMonths: 0,
      }).label
    ).toBe("Age unknown");
  });
});
