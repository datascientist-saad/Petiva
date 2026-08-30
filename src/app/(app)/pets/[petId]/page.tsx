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
import type { ActivityLevel, BodyCondition, DietGoal, FoodType, NeuteredStatus, PetWithDetails, Sex, Species } from "@/types/database";

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
        body_condition: pet.body_condition,
        diet_goal: pet.diet_goal,
        neutered: pet.neutered,
        activity_level: pet.activity_level,
        activity_level_extended: pet.activity_level_extended,
        food_brand: pet.food_brand,
        food_product: pet.food_product,
        food_type: pet.food_type,
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
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/health/diet">Diet plan</Link>
        </Button>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Body condition</Label>
                <Select
                  value={pet.body_condition ?? ""}
                  onValueChange={(v) => setPet({ ...pet, body_condition: v as BodyCondition })}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="underweight">Underweight</SelectItem>
                    <SelectItem value="ideal">Ideal</SelectItem>
                    <SelectItem value="overweight">Overweight</SelectItem>
                    <SelectItem value="unsure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Diet goal</Label>
                <Select
                  value={pet.diet_goal ?? ""}
                  onValueChange={(v) => setPet({ ...pet, diet_goal: v as DietGoal })}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintain">Maintain weight</SelectItem>
                    <SelectItem value="lose">Lose weight</SelectItem>
                    <SelectItem value="gain">Gain weight</SelectItem>
                    <SelectItem value="improve">Improve nutrition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Activity level</Label>
              <Select
                value={pet.activity_level_extended ?? pet.activity_level ?? ""}
                onValueChange={(v) =>
                  setPet({
                    ...pet,
                    activity_level_extended: v as PetWithDetails["activity_level_extended"],
                    activity_level:
                      v === "active" || v === "very_active"
                        ? "high"
                        : (v as ActivityLevel),
                  })
                }
              >
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very active</SelectItem>
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

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Food & nutrition</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Food type</Label>
                <Select value={pet.food_type ?? ""} onValueChange={(v) => setPet({ ...pet, food_type: v as FoodType })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">Dry</SelectItem>
                    <SelectItem value="wet">Wet</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                    <SelectItem value="other">Other / home-cooked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meals per day</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={pet.meals_per_day ?? ""}
                  onChange={(e) => setPet({ ...pet, meals_per_day: Number(e.target.value) || null })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Food brand</Label>
                <Input value={pet.food_brand ?? ""} onChange={(e) => setPet({ ...pet, food_brand: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Input value={pet.food_product ?? ""} onChange={(e) => setPet({ ...pet, food_product: e.target.value })} className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full rounded-xl">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
