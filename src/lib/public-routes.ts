/** Paths that must remain reachable without authentication. */
export const PUBLIC_PATH_PREFIXES = [
  "/",
  "/get-started",
  "/privacy",
  "/terms",
  "/ai-disclaimer",
  "/auth",
  "/invite",
  "/robots.txt",
  "/sitemap.xml",
] as const;

export const AUTH_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export const PRIVATE_APP_PREFIXES = [
  "/home",
  "/health",
  "/care",
  "/care-plan",
  "/reports",
  "/upgrade",
  "/ai",
  "/profile",
  "/settings",
  "/onboarding",
  "/setup",
  "/pets",
  "/admin",
  "/notifications",
] as const;

export function pathMatches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || (prefix !== "/" && pathname.startsWith(prefix)));
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.filter((prefix) => prefix !== "/").some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPrivateAppPath(pathname: string): boolean {
  return PRIVATE_APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
