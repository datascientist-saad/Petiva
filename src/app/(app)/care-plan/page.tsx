"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePet } from "@/contexts/pet-context";
import { getSpeciesDefinition } from "@/lib/species/registry";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { CareTaskService } from "@/services/care-task-service";
import { WellnessInsightService } from "@/services/wellness-insight-service";
import type { CareTask } from "@/types/database";

export default function CarePlanPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [insights, setInsights] = useState<Awaited<ReturnType<WellnessInsightService["listForPet"]>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    if (!selectedPetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const care = new CareTaskService(supabase);
      const insightService = new WellnessInsightService(supabase);
      const [taskList, insightList] = await Promise.all([
        care.list(selectedPetId),
        insightService.listForPet(selectedPetId, 3),
      ]);
      setTasks(taskList);
      setInsights(insightList);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view their care plan." />;
  }

  const speciesDef = getSpeciesDefinition(selectedPet.species);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Care plan"
        description={`Preventive-care roadmap for ${selectedPet.name}`}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <>
          <Card className="rounded-2xl border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">What does {selectedPet.name} need next?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {speciesDef.preventiveCareEngine === "bird"
                ? "Bird care focuses on daily habitat, nutrition, and observation — confirm veterinary schedules with an avian vet."
                : "Vaccination, parasite prevention, and wellness tasks are suggested based on your records and species."}
            </CardContent>
          </Card>

          {insights[0] ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{insights[0].title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{insights[0].body}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Roadmap tasks</CardTitle>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href="/care">
                  <Plus className="mr-1 size-4" />
                  Manage
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No care tasks yet.</p>
              ) : (
                tasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="rounded-xl bg-secondary/50 px-3 py-2 text-sm">
                    {task.title}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {speciesDef.features.habitat ? (
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href={`/pets/${selectedPet.id}/habitat`}>Bird habitat & safety</Link>
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
