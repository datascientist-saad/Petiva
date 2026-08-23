"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { HealthRecordService } from "@/services/health-record-service";
import { NutritionService } from "@/services/nutrition-service";
import { VaccinationService } from "@/services/vaccination-service";
import { WeightService } from "@/services/nutrition-service";
import { SymptomService } from "@/services/health-record-service";

interface TimelineItem {
  id: string;
  date: string;
  type: string;
  title: string;
  subtitle?: string;
}

export default function TimelinePage() {
  const { selectedPet, selectedPetId } = usePet();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const [weights, vax, records, meals, symptoms] = await Promise.all([
        new WeightService(supabase).list(selectedPetId),
        new VaccinationService(supabase).list(selectedPetId),
        new HealthRecordService(supabase).list(selectedPetId),
        new NutritionService(supabase).listMeals(selectedPetId),
        new SymptomService(supabase).list(selectedPetId),
      ]);

      const timeline: TimelineItem[] = [
        ...weights.map((w) => ({
          id: `w-${w.id}`,
          date: w.recorded_at,
          type: "weight",
          title: `Weight: ${w.weight_kg} kg`,
          subtitle: w.notes ?? undefined,
        })),
        ...vax.map((v) => ({
          id: `v-${v.id}`,
          date: v.administered_date ?? v.next_due_date ?? v.created_at,
          type: "vaccination",
          title: v.name,
          subtitle: v.administered_date ? "Administered" : "Due",
        })),
        ...records.map((r) => ({
          id: `r-${r.id}`,
          date: r.record_date,
          type: "record",
          title: r.title,
          subtitle: r.record_type.replace(/_/g, " "),
        })),
        ...meals.slice(0, 20).map((m) => ({
          id: `m-${m.id}`,
          date: m.logged_at,
          type: "meal",
          title: m.food_name,
          subtitle: `${m.amount} ${m.unit}`,
        })),
        ...symptoms.map((s) => ({
          id: `s-${s.id}`,
          date: s.started_at,
          type: "symptom",
          title: s.symptom,
          subtitle: s.severity,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setItems(timeline);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const typeEmoji: Record<string, string> = {
    weight: "⚖️",
    vaccination: "💉",
    record: "📋",
    meal: "🍽️",
    symptom: "🩺",
  };

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view timeline." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Timeline</h1>
          <p className="text-sm text-muted-foreground">{selectedPet.name}'s health journey</p>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing here yet" description="As you log care, it'll show up here." />
      ) : (
        <div className="relative space-y-0 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-border">
          {items.map((item) => (
            <Card key={item.id} className="relative mb-3 rounded-2xl">
              <span className="absolute -left-6 top-4 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px]">
                {typeEmoji[item.type] ?? "•"}
              </span>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                <p className="font-medium">{item.title}</p>
                {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
