"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { vaccinationSchema } from "@/lib/validations";
import { VaccinationService } from "@/services/vaccination-service";
import type { Vaccination } from "@/types/database";

interface AddVaccinationDialogProps {
  petId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  vaccination?: Vaccination | null;
}

export function AddVaccinationDialog({
  petId,
  open,
  onOpenChange,
  onSuccess,
  vaccination,
}: AddVaccinationDialogProps) {
  const [name, setName] = useState("");
  const [administeredDate, setAdministeredDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [clinic, setClinic] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vaccination) {
      setName(vaccination.name);
      setAdministeredDate(vaccination.administered_date ?? "");
      setNextDueDate(vaccination.next_due_date ?? "");
      setClinic(vaccination.clinic ?? "");
      setNotes(vaccination.notes ?? "");
    } else {
      setName("");
      setAdministeredDate("");
      setNextDueDate("");
      setClinic("");
      setNotes("");
    }
  }, [vaccination, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = vaccinationSchema.safeParse({
      name,
      administered_date: administeredDate || null,
      next_due_date: nextDueDate || null,
      clinic: clinic || null,
      notes: notes || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const service = new VaccinationService(supabase);
      if (vaccination) {
        await service.update(vaccination.id, parsed.data);
        toast.success("Vaccination updated.");
      } else {
        await service.create(petId, parsed.data);
        toast.success("Vaccination added — we'll help you stay on track.");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vaccination ? "Edit vaccination" : "Add vaccination"}</DialogTitle>
          <DialogDescription>Keep preventive care up to date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vax_name">Vaccine name</Label>
            <Input
              id="vax_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rabies"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vax_given">Date given</Label>
              <Input
                id="vax_given"
                type="date"
                value={administeredDate}
                onChange={(e) => setAdministeredDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vax_due">Next due</Label>
              <Input
                id="vax_due"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vax_clinic">Clinic (optional)</Label>
            <Input
              id="vax_clinic"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vax_notes">Notes (optional)</Label>
            <Textarea
              id="vax_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : vaccination ? "Update" : "Add vaccination"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
