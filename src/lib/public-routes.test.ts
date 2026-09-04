import { describe, expect, it } from "vitest";
import { isAuthPath, isPrivateAppPath, isPublicPath } from "./public-routes";

describe("public routes", () => {
  it("treats /ai-disclaimer as a public page", () => {
    expect(isPublicPath("/ai-disclaimer")).toBe(true);
    expect(isPrivateAppPath("/ai-disclaimer")).toBe(false);
    expect(isAuthPath("/ai-disclaimer")).toBe(false);
  });

  it("keeps privacy, terms, and onboarding entry public", () => {
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/terms")).toBe(true);
    expect(isPublicPath("/get-started")).toBe(true);
    expect(isPublicPath("/")).toBe(true);
  });

  it("does not treat dashboard routes as public", () => {
    expect(isPublicPath("/home")).toBe(false);
    expect(isPrivateAppPath("/home")).toBe(true);
    expect(isPrivateAppPath("/setup/complete")).toBe(true);
  });
});
