/**
 * Canonical public site URL. Prefer NEXT_PUBLIC_APP_URL.
 * Never treat Vercel preview hostnames as the production canonical.
 */
const PRODUCTION_FALLBACK = "https://animivo.app";
const KNOWN_PRODUCTION_HOSTS = new Set(["animivo.app", "www.animivo.app", "animivo.vercel.app"]);

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      return url.origin;
    } catch {
      // fall through
    }
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelEnv === "production" && vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    if (KNOWN_PRODUCTION_HOSTS.has(host)) {
      return `https://${host}`;
    }
  }

  return PRODUCTION_FALLBACK;
}

export function absoluteUrl(path = "/"): string {
  const origin = getSiteUrl();
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
