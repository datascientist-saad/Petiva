"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AddRecordDialog } from "@/components/forms/add-record-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { HealthRecordService } from "@/services/health-record-service";
import type { MedicalRecord } from "@/types/database";

export default function RecordsPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new HealthRecordService(supabase);
      setRecords(await service.list(selectedPetId));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function openAttachment(record: MedicalRecord) {
    if (!record.attachment_url) return;
    try {
      const service = new HealthRecordService(supabase);
      const url = await service.getSignedUrl(record.attachment_url);
      window.open(url, "_blank");
    } catch (err) {
      toUserMessage(err);
    }
  }

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view health records." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Health records</h1>
          <p className="text-sm text-muted-foreground">Vet visits, labs & documents</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl">Add</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No records yet"
          description="Upload vet visits, lab results, or prescriptions."
          action={{ label: "Add record", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(r.record_date)} · {r.record_type.replace(/_/g, " ")}
                    </p>
                    {r.clinic && <p className="text-xs text-muted-foreground">{r.clinic}</p>}
                  </div>
                  {r.attachment_url && (
                    <Button variant="ghost" size="icon" onClick={() => void openAttachment(r)} className="rounded-lg">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {r.notes && <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPetId && (
        <AddRecordDialog petId={selectedPetId} open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadData} />
      )}
    </div>
  );
}
