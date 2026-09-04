import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  const title = input.title;
  const description = input.description;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: brand.name,
      images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/opengraph-image")],
    },
    metadataBase: new URL(getSiteUrl()),
  };
}

export function privatePageMetadata(input: { title: string; description?: string }): Metadata {
  return {
    title: input.title,
    description: input.description ?? `${brand.name} account`,
    robots: { index: false, follow: false },
  };
}
