import type { Metadata } from "next";
import { LandingContent } from "@/components/marketing/landing-content";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/lib/brand";
import { publicPageMetadata } from "@/lib/seo";
import { organizationJsonLd, webApplicationJsonLd } from "@/lib/seo-jsonld";

export const metadata: Metadata = publicPageMetadata({
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.subtitle,
  path: "/",
});

export default function HomePage() {
  return (
    <MarketingShell>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webApplicationJsonLd()} />
      <LandingContent />
    </MarketingShell>
  );
}
