import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/get-started", "/privacy", "/terms", "/ai-disclaimer", "/login", "/signup"],
        disallow: [
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
          "/auth/callback",
          "/api/",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
