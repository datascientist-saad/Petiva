"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/shared/page-states";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { calculatePetAge, speciesEmoji } from "@/lib/calculations";
import { PetService } from "@/services/pet-service";
import type { ActivityLevel, NeuteredStatus, PetWithDetails, Sex, Species } from "@/types/database";

export default function PetDetailPage() {
  const params = useParams();
  const petId = params.petId as string;
  const [pet, setPet] = useState<PetWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadPet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const service = new PetService(supabase);
      const data = await service.getById(petId);
      if (!data) {
        setError("Pet not found.");
        return;
      }
      setPet(data);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [petId, supabase]);

  useEffect(() => {
    void loadPet();
  }, [loadPet]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!pet) return;
    setSaving(true);
    try {
      const service = new PetService(supabase);
      await service.update(pet.id, {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birth_date: pet.birth_date,
        sex: pet.sex,
        weight_kg: pet.weight_kg,
        neutered: pet.neutered,
        activity_level: pet.activity_level,
        food_brand: pet.food_brand,
        food_product: pet.food_product,
        daily_food_target: pet.daily_food_target,
        meals_per_day: pet.meals_per_day,
      });
      toast.success(`${pet.name}'s profile updated!`);
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error || !pet) return <ErrorState message={error ?? "Pet not found."} onRetry={loadPet} />;

  const age = calculatePetAge(pet);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/profile"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {speciesEmoji(pet.species)} {pet.name}
          </h1>
          <p className="text-sm text-muted-foreground">{age.label} old</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={pet.name} onChange={(e) => setPet({ ...pet, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Species</Label>
                <Select value={pet.species} onValueChange={(v) => setPet({ ...pet, species: v as Species })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Breed</Label>
                <Input value={pet.breed ?? ""} onChange={(e) => setPet({ ...pet, breed: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Birth date</Label>
                <Input type="date" value={pet.birth_date ?? ""} onChange={(e) => setPet({ ...pet, birth_date: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <Select value={pet.sex ?? ""} onValueChange={(v) => setPet({ ...pet, sex: v as Sex })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Health & activity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={pet.weight_kg ?? ""} onChange={(e) => setPet({ ...pet, weight_kg: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Neutered</Label>
                <Select value={pet.neutered} onValueChange={(v) => setPet({ ...pet, neutered: v as NeuteredStatus })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Activity level</Label>
              <Select value={pet.activity_level ?? ""} onValueChange={(v) => setPet({ ...pet, activity_level: v as ActivityLevel })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pet.conditions.length > 0 && (
              <div>
                <Label>Conditions</Label>
                <p className="text-sm text-muted-foreground">{pet.conditions.map((c) => c.name).join(", ")}</p>
              </div>
            )}
            {pet.allergies.length > 0 && (
              <div>
                <Label>Allergies</Label>
                <p className="text-sm text-muted-foreground">{pet.allergies.map((a) => a.name).join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full rounded-xl">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
