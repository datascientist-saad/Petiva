import { describe, expect, it } from "vitest";
import { canAddPet, getPlan, hasFeature } from "./plans";

describe("subscription entitlements", () => {
  it("limits free plan to one pet", () => {
    expect(canAddPet("free", 0)).toBe(true);
    expect(canAddPet("free", 1)).toBe(false);
  });

  it("enables vet reports on plus", () => {
    expect(hasFeature("free", "vetReports")).toBe(false);
    expect(hasFeature("plus", "vetReports")).toBe(true);
  });

  it("exposes AI limits per plan", () => {
    expect(getPlan("free").aiDailyLimit).toBe(20);
    expect(getPlan("plus").aiDailyLimit).toBe(100);
  });
});
