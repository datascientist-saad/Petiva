"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { medicationSchema } from "@/lib/validations";
import { CareTaskService } from "@/services/care-task-service";
import { MedicationService } from "@/services/medication-service";

interface AddMedicationDialogProps {
  petId: string;
  petName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Every other day",
  "Weekly",
  "As needed",
];

export function AddMedicationDialog({
  petId,
  petName = "your pet",
  open,
  onOpenChange,
  onSuccess,
}: AddMedicationDialogProps) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("tablet");
  const [frequency, setFrequency] = useState("Once daily");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = medicationSchema.safeParse({
      name,
      dose,
      unit,
      frequency,
      start_date: new Date().toISOString().slice(0, 10),
      instructions: instructions || null,
      status: "active",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to add medication.");
      const medService = new MedicationService(supabase);
      const careService = new CareTaskService(supabase);
      await medService.create(petId, parsed.data);

      if (parsed.data.status === "active") {
        const freq = parsed.data.frequency.toLowerCase();
        if (freq.includes("once daily") || freq === "daily") {
          await careService.create(petId, user.id, {
            title: `Give ${parsed.data.name}`,
            category: "medication",
            frequency: "daily",
            scheduled_time: "08:00",
            notes: `${parsed.data.dose} ${parsed.data.unit}`,
          });
        } else if (freq.includes("twice daily")) {
          await careService.create(petId, user.id, {
            title: `Give ${parsed.data.name} (morning)`,
            category: "medication",
            frequency: "daily",
            scheduled_time: "08:00",
            notes: `${parsed.data.dose} ${parsed.data.unit}`,
          });
          await careService.create(petId, user.id, {
            title: `Give ${parsed.data.name} (evening)`,
            category: "medication",
            frequency: "daily",
            scheduled_time: "20:00",
            notes: `${parsed.data.dose} ${parsed.data.unit}`,
          });
        }
      }

      toast.success(`Medication saved for ${petName}.`);
      setName("");
      setDose("");
      setInstructions("");
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
          <DialogTitle>Add medication</DialogTitle>
          <DialogDescription>
            Record what {petName} is taking. Always follow your vet's instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="med_name">Medication name</Label>
            <Input
              id="med_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apoquel"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="med_dose">Dose</Label>
              <Input
                id="med_dose"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="1"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med_unit">Unit</Label>
              <Input
                id="med_unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="tablet"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="med_instructions">Instructions (optional)</Label>
            <Textarea
              id="med_instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="With food, etc."
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : "Save medication"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
