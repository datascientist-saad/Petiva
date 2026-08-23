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
import { careTaskSchema } from "@/lib/validations";
import { CareTaskService } from "@/services/care-task-service";
import type { CareCategory, CareFrequency } from "@/types/database";

interface AddCareTaskDialogProps {
  petId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES: { value: CareCategory; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "medication", label: "Medication" },
  { value: "vaccination", label: "Vaccination" },
  { value: "weight", label: "Weight" },
  { value: "grooming", label: "Grooming" },
  { value: "activity", label: "Activity" },
  { value: "vet", label: "Vet" },
  { value: "custom", label: "Custom" },
];

const FREQUENCIES: { value: CareFrequency; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom interval" },
];

export function AddCareTaskDialog({ petId, open, onOpenChange, onSuccess }: AddCareTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CareCategory>("custom");
  const [frequency, setFrequency] = useState<CareFrequency>("daily");
  const [customDays, setCustomDays] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = careTaskSchema.safeParse({
      title,
      category,
      frequency,
      custom_interval_days: frequency === "custom" ? customDays : null,
      scheduled_time: scheduledTime || null,
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
      if (!user) throw new Error("Please sign in to create tasks.");
      const service = new CareTaskService(supabase);
      await service.create(petId, user.id, parsed.data);
      toast.success("Care task added to your plan!");
      setTitle("");
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
          <DialogTitle>Add care task</DialogTitle>
          <DialogDescription>Create a recurring reminder for your pet's care.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task_title">Task</Label>
            <Input
              id="task_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brush teeth"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CareCategory)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as CareFrequency)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {frequency === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom_days">Every N days</Label>
              <Input
                id="custom_days"
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="3"
                className="rounded-xl"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Time (optional)</Label>
            <Input
              id="scheduled_time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task_notes">Notes (optional)</Label>
            <Textarea
              id="task_notes"
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
              {saving ? "Saving…" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
