"use client";

import Link from "next/link";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { Button } from "@/components/ui/button";

export function LandingCta({
  href,
  children,
  variant = "default",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <Button asChild size="lg" variant={variant} className="min-h-12 rounded-full px-8">
      <Link
        href={href}
        onClick={() => {
          if (href === "/get-started") {
            trackEvent(AnalyticsEvents.LANDING_CTA_CLICKED, { destination: "get-started" });
          }
        }}
      >
        {children}
      </Link>
    </Button>
  );
}
