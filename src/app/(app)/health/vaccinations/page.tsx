"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddVaccinationDialog } from "@/components/forms/add-vaccination-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { VaccinationService } from "@/services/vaccination-service";
import type { Vaccination } from "@/types/database";

function statusBadge(status: Vaccination["status"]) {
  switch (status) {
    case "completed":
      return <Badge className="bg-success/15 text-success hover:bg-success/20">Completed</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="secondary">Due soon</Badge>;
  }
}

export default function VaccinationsPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vaccination | null>(null);
  const [deleting, setDeleting] = useState<Vaccination | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new VaccinationService(supabase);
      setVaccinations(await service.list(selectedPetId));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const upcoming = vaccinations.filter((v) => v.status !== "completed");
  const completed = vaccinations.filter((v) => v.status === "completed");

  async function handleDelete() {
    if (!deleting) return;
    try {
      const service = new VaccinationService(supabase);
      await service.remove(deleting.id);
      toast.success("Vaccination removed.");
      setDeleting(null);
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view vaccinations." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Vaccinations</h1>
          <p className="text-sm text-muted-foreground">Stay ahead of preventive care</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="rounded-xl">
          Add
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : vaccinations.length === 0 ? (
        <EmptyState
          title="No vaccinations yet"
          description="Add your pet's vaccine history to get helpful reminders."
          action={{ label: "Add vaccination", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Upcoming & due</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">All caught up for now!</p>
              ) : (
                upcoming.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.next_due_date ? `Due ${formatDate(v.next_due_date)}` : "No due date set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(v.status)}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(v); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(v)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed vaccinations recorded.</p>
              ) : (
                completed.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.administered_date ? `Given ${formatDate(v.administered_date)}` : "Date not recorded"}
                      </p>
                    </div>
                    {statusBadge("completed")}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedPetId && (
        <AddVaccinationDialog
          petId={selectedPetId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadData}
          vaccination={editing}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vaccination?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleting?.name} from {selectedPet.name}'s records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
