"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { PLAN_DEFINITIONS } from "@/lib/entitlements/plans";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsService } from "@/services/notification-service";

export default function UpgradePage() {
  const plans = [PLAN_DEFINITIONS.free, PLAN_DEFINITIONS.plus];
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const analytics = new AnalyticsService(supabase);
      await analytics.track(AnalyticsEvents.UPGRADE_VIEWED, user?.id);
    })();
  }, [supabase]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Animivo Plus"
        description="Subscription-ready plans — billing connects when a payment provider is configured."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.id === "plus" ? "rounded-2xl border-primary/30 shadow-md" : "rounded-2xl"}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Up to {plan.maxPets} pet{plan.maxPets === 1 ? "" : "s"}</p>
              <ul className="space-y-2">
                {Object.entries(plan.features).map(([key, enabled]) =>
                  enabled ? (
                    <li key={key} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-primary" />
                      <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                    </li>
                  ) : null
                )}
              </ul>
              {plan.id === "plus" ? (
                <Button disabled className="w-full rounded-xl">
                  Connect billing to upgrade
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link href="/home">Current plan</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {brand.name} pilot users keep access during development. Payments are not processed until a
        server-side billing adapter is connected.
      </p>
    </div>
  );
}
