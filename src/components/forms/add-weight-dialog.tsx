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
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { weightSchema } from "@/lib/validations";
import { WeightService } from "@/services/nutrition-service";

interface AddWeightDialogProps {
  petId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddWeightDialog({ petId, open, onOpenChange, onSuccess }: AddWeightDialogProps) {
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = weightSchema.safeParse({
      weight_kg: weightKg,
      recorded_at: new Date().toISOString(),
      notes: notes || null,
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
      if (!user) throw new Error("Please sign in to add weight.");
      const service = new WeightService(supabase);
      await service.add(petId, user.id, parsed.data);
      toast.success("Weight recorded — you're doing great!");
      setWeightKg("");
      setNotes("");
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
          <DialogTitle>Add weight</DialogTitle>
          <DialogDescription>Track your pet's weight over time.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 12.5"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_notes">Notes (optional)</Label>
            <Textarea
              id="weight_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="After breakfast, at the vet, etc."
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : "Save weight"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
