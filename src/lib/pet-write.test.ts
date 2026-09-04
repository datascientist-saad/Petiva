import { describe, expect, it } from "vitest";
import { nextPetWriteAttempt } from "./pet-write";

describe("nextPetWriteAttempt", () => {
  const base = {
    name: "Kiwi",
    species: "bird",
    owner_id: "user-1",
    weight_unit: "g",
    weight_grams: 350,
    life_stage: "adult",
    sex: "unknown",
  };

  it("retries grams as kilograms when the leftover weight_unit check rejects g", () => {
    const next = nextPetWriteAttempt(base, {
      message: "new row violates check constraint pets_weight_unit_check",
    });
    expect(next?.weight_unit).toBe("kg");
    expect(next?.weight_grams).toBe(350);
    expect(next?.species).toBe("bird");
  });

  it("omits a column that is missing from the schema cache", () => {
    const next = nextPetWriteAttempt(base, {
      code: "PGRST204",
      message: "Could not find the 'life_stage' column of 'pets' in the schema cache",
    });
    expect(next && "life_stage" in next).toBe(false);
    expect(next?.name).toBe("Kiwi");
  });

  it("does not retry a leftover cat/dog species check", () => {
    const next = nextPetWriteAttempt(base, {
      message: "new row for relation \"pets\" violates check constraint \"pets_species_check\"",
    });
    expect(next).toBeNull();
  });

  it("retries unknown sex as null", () => {
    const next = nextPetWriteAttempt(base, {
      message: "new row violates check constraint pets_sex_check",
    });
    expect(next?.sex).toBeNull();
  });
});
