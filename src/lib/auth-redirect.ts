/**
 * Resolve post-auth destination. Invite links and explicit `next` paths take
 * priority over onboarding so caregivers aren't sent to create a pet profile.
 */
export function resolvePostAuthPath(
  next: string | null | undefined,
  options: { hasIncompleteOnboarding: boolean; hasNoPets: boolean }
): string {
  const fallback = "/home";
  const target = next?.trim() || fallback;

  if (target.startsWith("/invite/") || target === "/setup/complete") {
    return target;
  }

  if (options.hasNoPets || options.hasIncompleteOnboarding) {
    return "/onboarding";
  }

  return target;
}
