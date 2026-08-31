"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { AlertBanner } from "@/components/shared/alert-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";

const SAFETY_ITEMS = [
  "Non-stick cookware fumes",
  "Smoke and vaping",
  "Aerosols and strong fragrances",
  "Cleaning chemicals near the cage",
  "Ceiling fans when bird is out",
  "Open windows without screens",
  "Toxic houseplants",
  "Electrical cables",
  "Heavy-metal exposure risks",
  "Unsupervised contact with predators",
] as const;

export default function BirdHabitatPage() {
  const params = useParams();
  const petId = params.petId as string;
  const { selectedPet } = usePet();
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const { error } = await supabase.from("bird_habitat_assessments").insert({
        pet_id: petId,
        created_by: user.id,
        safety_checklist: checklist,
      });
      if (error) throw error;
      toast.success("Habitat review saved.");
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Habitat & safety"
        description={`Educational checklist for ${selectedPet?.name ?? "your bird"}`}
      />

      <AlertBanner variant="info">
        This checklist is educational only — not a professional home-safety certification. Discuss
        concerns with an avian veterinarian.
      </AlertBanner>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Household safety review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SAFETY_ITEMS.map((item) => (
            <label key={item} className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={!!checklist[item]}
                onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, [item]: !!c }))}
              />
              <span>{item} — reviewed / addressed</span>
            </label>
          ))}
          <Button onClick={save} disabled={saving} className="mt-4 w-full rounded-xl">
            {saving ? "Saving…" : "Save review"}
          </Button>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/care-plan">Back to care plan</Link>
      </Button>
    </div>
  );
}
