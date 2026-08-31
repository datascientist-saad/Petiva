"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/shared/page-states";
import { brand } from "@/lib/brand";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { calculatePetAge } from "@/lib/calculations";
import { getSpeciesDefinition } from "@/lib/species/registry";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { t, DEFAULT_LOCALE } from "@/lib/i18n";
import { AnalyticsService } from "@/services/notification-service";
import { PetService } from "@/services/pet-service";
import type { PetWithDetails } from "@/types/database";

export default function VetReportPage() {
  const params = useParams();
  const petId = params.petId as string;
  const [pet, setPet] = useState<PetWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const petService = new PetService(supabase);
      const data = await petService.getById(petId);
      if (!data) {
        setError("Pet not found or you do not have access.");
        return;
      }
      setPet(data);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [petId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pet) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const analytics = new AnalyticsService(supabase);
      await analytics.track(AnalyticsEvents.VET_REPORT_VIEWED, user.id, pet.id);
    })();
  }, [pet, supabase]);

  if (loading) return <LoadingState message="Preparing report…" />;
  if (error || !pet) return <ErrorState message={error ?? "Report unavailable."} onRetry={load} />;

  const speciesDef = getSpeciesDefinition(pet.species);
  const age = calculatePetAge(pet);

  return (
    <div className="vet-report mx-auto max-w-3xl space-y-6 print:max-w-none print:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href={`/pets/${pet.id}`}>← Back to profile</Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-xl">
          <Printer className="mr-2 size-4" />
          Print or Save as PDF
        </Button>
      </div>

      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">{brand.name} veterinary report</p>
        <h1 className="font-display text-2xl font-semibold">
          {speciesDef.icon} {pet.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {speciesDef.displayName}
          {pet.breed ? ` · ${pet.breed}` : ""} · {age.label} old
        </p>
      </header>

      <Card className="rounded-2xl print:shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Profile summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Weight: </span>
            {pet.weight_grams != null
              ? `${pet.weight_grams} g`
              : pet.weight_kg != null
                ? `${pet.weight_kg} kg`
                : "Not recorded"}
          </p>
          <p>
            <span className="text-muted-foreground">Conditions (owner-entered): </span>
            {pet.conditions.map((c) => c.name).join(", ") || "None recorded"}
          </p>
          <p>
            <span className="text-muted-foreground">Allergies (owner-entered): </span>
            {pet.allergies.map((a) => a.name).join(", ") || "None recorded"}
          </p>
          {pet.diet_goal ? (
            <p>
              <span className="text-muted-foreground">Diet goal (owner-entered): </span>
              {pet.diet_goal}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {t(DEFAULT_LOCALE, "safety.vetDisclaimer")} Calculated nutrition guidance is labeled separately
        in the Animivo app and is not a prescription.
      </p>
    </div>
  );
}
