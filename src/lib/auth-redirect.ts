/**
 * Resolve post-auth destination. Invite links and explicit `next` paths take
 * priority over onboarding so caregivers aren't sent to create a pet profile.
 */

const SAFE_NEXT_PREFIXES = [
  "/home",
  "/setup/complete",
  "/onboarding",
  "/invite/",
  "/reset-password",
  "/health",
  "/care",
  "/care-plan",
  "/pets",
  "/profile",
  "/settings",
  "/ai",
  "/reports",
  "/upgrade",
  "/notifications",
  "/admin",
] as const;

export const DEFAULT_POST_AUTH_PATH = "/home";

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_POST_AUTH_PATH;
  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return DEFAULT_POST_AUTH_PATH;
  }
  if (value.includes("\\") || value.includes("\0")) {
    return DEFAULT_POST_AUTH_PATH;
  }
  const path = value.split("?")[0] ?? value;
  const allowed = SAFE_NEXT_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
  return allowed ? value : DEFAULT_POST_AUTH_PATH;
}

export function resolvePostAuthPath(
  next: string | null | undefined,
  options: {
    hasIncompleteOnboarding: boolean;
    hasNoPets: boolean;
    hasPendingOnboardingDraft?: boolean;
  }
): string {
  const target = sanitizeNextPath(next);

  if (options.hasPendingOnboardingDraft) {
    return "/setup/complete";
  }

  if (target.startsWith("/invite/") || target === "/setup/complete" || target === "/reset-password") {
    return target;
  }

  if (options.hasNoPets || options.hasIncompleteOnboarding) {
    return "/onboarding";
  }

  return target;
}
