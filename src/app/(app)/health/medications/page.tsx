"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddMedicationDialog } from "@/components/forms/add-medication-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { getActiveMedications } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { MedicationService } from "@/services/medication-service";
import type { Medication } from "@/types/database";

export default function MedicationsPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new MedicationService(supabase);
      setMedications(await service.list(selectedPetId));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const active = useMemo(() => getActiveMedications(medications), [medications]);
  const past = medications.filter((m) => m.status === "past" || !active.find((a) => a.id === m.id));

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view medications." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Medications</h1>
          <p className="text-sm text-muted-foreground">Always follow your vet's guidance</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl">Add</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : medications.length === 0 ? (
        <EmptyState
          title="No medications recorded"
          description="Add any prescriptions or supplements your pet takes."
          action={{ label: "Add medication", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Active</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active medications right now.</p>
              ) : (
                active.map((m) => (
                  <div key={m.id} className="rounded-xl bg-secondary/50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{m.name}</p>
                      <Badge>Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {m.dose} {m.unit} · {m.frequency}
                    </p>
                    {m.instructions && <p className="mt-1 text-xs text-muted-foreground">{m.instructions}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Past</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past medications.</p>
              ) : (
                past.map((m) => (
                  <div key={m.id} className="rounded-xl bg-secondary/50 p-3 opacity-70">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.dose} {m.unit} · {m.frequency}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedPetId && (
        <AddMedicationDialog
          petId={selectedPetId}
          petName={selectedPet.name}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
