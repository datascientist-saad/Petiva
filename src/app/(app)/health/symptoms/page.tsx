"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { symptomSchema } from "@/lib/validations";
import { formatDate } from "@/lib/utils";
import { SymptomService } from "@/services/health-record-service";
import type { Symptom, SymptomSeverity } from "@/types/database";

export default function SymptomsPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState<SymptomSeverity>("mild");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new SymptomService(supabase);
      setSymptoms(await service.list(selectedPetId));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const active = symptoms.filter((s) => s.status === "active");
  const resolved = symptoms.filter((s) => s.status === "resolved");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const parsed = symptomSchema.safeParse({
      symptom,
      severity,
      started_at: new Date().toISOString(),
      description: description || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedPetId) throw new Error("Please sign in.");
      const service = new SymptomService(supabase);
      await service.create(selectedPetId, user.id, parsed.data);
      toast.success("Symptom logged. If you're worried, contact your vet.");
      setSymptom("");
      setDescription("");
      setDialogOpen(false);
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function resolveSymptom(id: string) {
    try {
      const service = new SymptomService(supabase);
      await service.resolve(id);
      toast.success("Marked as resolved — glad they're feeling better!");
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function deleteSymptom(id: string) {
    try {
      const service = new SymptomService(supabase);
      await service.remove(id);
      toast.success("Symptom removed.");
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view symptoms." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Symptoms</h1>
          <p className="text-sm text-muted-foreground">Track what you notice</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl">Log</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : symptoms.length === 0 ? (
        <EmptyState
          title="No symptoms logged"
          description="That's usually a good sign! Log anything you notice."
          action={{ label: "Log symptom", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Active</h2>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active symptoms.</p>
            ) : (
              active.map((s) => (
                <Card key={s.id} className="rounded-2xl">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{s.symptom}</p>
                        <Badge variant={s.severity === "severe" ? "destructive" : "secondary"}>{s.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Started {formatDate(s.started_at)}</p>
                      {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => void resolveSymptom(s.id)} className="rounded-lg text-success">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => void deleteSymptom(s.id)} className="rounded-lg text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          {resolved.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Resolved</h2>
              {resolved.map((s) => (
                <Card key={s.id} className="rounded-2xl opacity-70">
                  <CardContent className="p-4">
                    <p className="font-medium">{s.symptom}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.started_at)}
                      {s.resolved_at && ` → ${formatDate(s.resolved_at)}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log a symptom</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Symptom</Label>
              <Input value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="e.g. Limping" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as SymptomSeverity)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xl">{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
