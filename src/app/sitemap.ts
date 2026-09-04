import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const PUBLIC_PATHS = ["/", "/get-started", "/privacy", "/terms", "/ai-disclaimer", "/login", "/signup"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
