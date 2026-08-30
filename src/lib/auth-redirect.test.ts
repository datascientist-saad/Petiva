import { describe, expect, it } from "vitest";
import { resolvePostAuthPath } from "./auth-redirect";

describe("resolvePostAuthPath", () => {
  it("prioritizes setup complete over onboarding", () => {
    expect(
      resolvePostAuthPath("/setup/complete", {
        hasNoPets: true,
        hasIncompleteOnboarding: true,
      })
    ).toBe("/setup/complete");
  });

  it("prioritizes invite links over onboarding", () => {
    expect(
      resolvePostAuthPath("/invite/abc123", {
        hasNoPets: true,
        hasIncompleteOnboarding: true,
      })
    ).toBe("/invite/abc123");
  });

  it("prioritizes pending onboarding draft over onboarding", () => {
    expect(
      resolvePostAuthPath("/home", {
        hasNoPets: true,
        hasIncompleteOnboarding: true,
        hasPendingOnboardingDraft: true,
      })
    ).toBe("/setup/complete");
  });

  it("sends new pet owners to onboarding", () => {
    expect(
      resolvePostAuthPath("/home", {
        hasNoPets: true,
        hasIncompleteOnboarding: false,
      })
    ).toBe("/onboarding");
  });

  it("returns requested path for users with pets", () => {
    expect(
      resolvePostAuthPath("/care", {
        hasNoPets: false,
        hasIncompleteOnboarding: false,
      })
    ).toBe("/care");
  });
});
