"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { toUserMessage } from "@/lib/errors";
import { getSpeciesDefinition } from "@/lib/species/registry";
import { AnalyticsService } from "@/services/notification-service";
import { DietCheckInService } from "@/services/diet-check-in-service";
import type { Pet } from "@/types/database";

interface DietCheckInDialogProps {
  pet: Pet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DietCheckInDialog({ pet, open, onOpenChange, onSuccess }: DietCheckInDialogProps) {
  const [appetite, setAppetite] = useState("");
  const [foodAdherence, setFoodAdherence] = useState("");
  const [treatIntake, setTreatIntake] = useState("");
  const [activityChange, setActivityChange] = useState("none");
  const [planSuitable, setPlanSuitable] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const speciesDef = getSpeciesDefinition(pet.species);
  const stoolLabel = pet.species === "bird" ? "Droppings" : "Stool";

  async function submit() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const service = new DietCheckInService(supabase);
      await service.create({
        petId: pet.id,
        createdBy: user.id,
        weightKg: pet.weight_kg,
        weightGrams: pet.weight_grams,
        appetite: appetite || null,
        foodAdherence: foodAdherence || null,
        treatIntake: treatIntake || null,
        activityChange: activityChange === "none" ? null : activityChange,
        planSuitable: planSuitable === "yes" ? true : planSuitable === "no" ? false : null,
        adjustmentRecommended: planSuitable === "no",
        ownerNotes: notes || null,
      });

      const analytics = new AnalyticsService(supabase);
      await analytics.track(AnalyticsEvents.DIET_CHECK_IN, user.id, pet.id);

      toast.success("Check-in saved. Your plan history is preserved.");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Diet check-in for {pet.name}</DialogTitle>
          <DialogDescription>
            Weekly check-ins help Animivo adapt {pet.name}&apos;s nutrition plan. This does not replace
            veterinary advice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Appetite</Label>
            <Select value={appetite} onValueChange={setAppetite}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="How is appetite?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="increased">Increased</SelectItem>
                <SelectItem value="decreased">Decreased</SelectItem>
                <SelectItem value="refusing">Refusing food</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Following the plan</Label>
            <Select value={foodAdherence} onValueChange={setFoodAdherence}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Food adherence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mostly">Mostly on target</SelectItem>
                <SelectItem value="sometimes">Sometimes over/under</SelectItem>
                <SelectItem value="often_over">Often over target</SelectItem>
                <SelectItem value="often_under">Often under target</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Treats</Label>
            <Select value={treatIntake} onValueChange={setTreatIntake}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Treat intake" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="within">Within allowance</SelectItem>
                <SelectItem value="slightly_over">Slightly over</SelectItem>
                <SelectItem value="well_over">Well over allowance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {speciesDef.features.walks && (
            <div className="space-y-2">
              <Label>Activity change</Label>
              <Select value={activityChange} onValueChange={setActivityChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No change</SelectItem>
                  <SelectItem value="more">More active</SelectItem>
                  <SelectItem value="less">Less active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Does the current plan still feel right?</Label>
            <Select value={planSuitable} onValueChange={setPlanSuitable}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Plan suitability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, on track</SelectItem>
                <SelectItem value="unsure">Unsure — would like review</SelectItem>
                <SelectItem value="no">No — needs adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{stoolLabel} (optional)</Label>
            <Textarea
              className="rounded-xl"
              placeholder={`Any changes in ${stoolLabel.toLowerCase()}?`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={() => void submit()} disabled={saving}>
            {saving ? "Saving…" : "Save check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
