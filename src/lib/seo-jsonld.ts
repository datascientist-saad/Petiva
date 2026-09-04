import { brand } from "@/lib/brand";
import { legalEmail } from "@/lib/legal/config";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: getSiteUrl(),
    email: legalEmail(),
    logo: absoluteUrl("/icons/icon-512.png"),
    description: brand.subtitle,
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brand.name,
    url: getSiteUrl(),
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description: brand.subtitle,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
