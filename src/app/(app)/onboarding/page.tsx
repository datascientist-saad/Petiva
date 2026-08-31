"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePet } from "@/contexts/pet-context";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { calculatePetAge, speciesEmoji } from "@/lib/calculations";
import { AnalyticsService } from "@/services/notification-service";
import { CareTaskService } from "@/services/care-task-service";
import { PetService } from "@/services/pet-service";
import { VaccinationService } from "@/services/vaccination-service";
import { WeightService } from "@/services/nutrition-service";
import type { ActivityLevel, FoodType, FoodUnit, NeuteredStatus, Sex, Species } from "@/types/database";

const STEPS = ["Basics", "Health", "Food", "Preventive care", "All set!"];
const TOTAL_STEPS = 5;

interface OnboardingData {
  name: string;
  species: Species;
  breed: string;
  birth_date: string;
  estimated_age_years: string;
  estimated_age_months: string;
  use_approximate_age: boolean;
  sex: Sex | "";
  photoFile: File | null;
  weight_kg: string;
  neutered: NeuteredStatus;
  activity_level: ActivityLevel | "";
  conditions: string;
  allergies: string;
  no_conditions: boolean;
  no_allergies: boolean;
  food_brand: string;
  food_product: string;
  food_type: FoodType | "";
  meals_per_day: string;
  daily_food_target: string;
  food_unit: FoodUnit;
  last_deworming: string;
  vaccinations: Array<{ name: string; administered_date: string; next_due_date: string }>;
}

const initialData: OnboardingData = {
  name: "",
  species: "cat",
  breed: "",
  birth_date: "",
  estimated_age_years: "",
  estimated_age_months: "",
  use_approximate_age: false,
  sex: "",
  photoFile: null,
  weight_kg: "",
  neutered: "unknown",
  activity_level: "",
  conditions: "",
  allergies: "",
  no_conditions: false,
  no_allergies: false,
  food_brand: "",
  food_product: "",
  food_type: "",
  meals_per_day: "2",
  daily_food_target: "",
  food_unit: "grams",
  last_deworming: "",
  vaccinations: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshPets } = usePet();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [saving, setSaving] = useState(false);
  const [vaxName, setVaxName] = useState("");
  const [vaxGiven, setVaxGiven] = useState("");
  const [vaxDue, setVaxDue] = useState("");

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const photoPreview = useMemo(
    () => (data.photoFile ? URL.createObjectURL(data.photoFile) : null),
    [data.photoFile]
  );

  const summaryAge = calculatePetAge({
    birth_date: data.use_approximate_age ? null : data.birth_date || null,
    estimated_age_months: data.use_approximate_age
      ? Number(data.estimated_age_years || 0) * 12 + Number(data.estimated_age_months || 0)
      : null,
  });

  function next() {
    if (step === 0 && !data.name.trim()) {
      toast.error("What's your pet's name?");
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function addVaccination() {
    if (!vaxName.trim()) return;
    setData((d) => ({
      ...d,
      vaccinations: [
        ...d.vaccinations,
        { name: vaxName, administered_date: vaxGiven, next_due_date: vaxDue },
      ],
    }));
    setVaxName("");
    setVaxGiven("");
    setVaxDue("");
  }

  async function uploadPhoto(userId: string, petId: string, file: File) {
    const supabase = createClient();
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });
    const ext = compressed.name.split(".").pop() || "jpg";
    const path = `${userId}/${petId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("pet-photos").upload(path, compressed, {
      upsert: true,
      contentType: compressed.type || "image/jpeg",
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("pet-photos").getPublicUrl(path);
    return pub.publicUrl;
  }

  async function finish() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to continue.");

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ??
            user.email?.split("@")[0] ??
            "Pet parent",
        },
        { onConflict: "id" }
      );
      if (profileError) throw profileError;

      const petService = new PetService(supabase);
      const careService = new CareTaskService(supabase);
      const vaxService = new VaccinationService(supabase);
      const weightService = new WeightService(supabase);
      const analytics = new AnalyticsService(supabase);

      const estimatedMonths = data.use_approximate_age
        ? Number(data.estimated_age_years || 0) * 12 + Number(data.estimated_age_months || 0)
        : null;

      const pet = await petService.create({
        owner_id: user.id,
        name: data.name.trim(),
        species: data.species,
        breed: data.breed || null,
        birth_date: data.use_approximate_age ? null : data.birth_date || null,
        estimated_age_months: estimatedMonths || null,
        sex: data.sex || null,
        weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
        neutered: data.neutered,
        activity_level: data.activity_level || null,
        food_brand: data.food_brand || null,
        food_product: data.food_product || null,
        food_type: data.food_type || null,
        meals_per_day: data.meals_per_day ? Number(data.meals_per_day) : null,
        daily_food_target: data.daily_food_target ? Number(data.daily_food_target) : null,
        food_unit: data.food_unit,
        onboarding_completed: true,
      });

      if (data.photoFile) {
        try {
          const url = await uploadPhoto(user.id, pet.id, data.photoFile);
          await petService.update(pet.id, { profile_image_url: url });
        } catch (photoError) {
          console.warn("[Animivo:onboarding] Photo upload failed", photoError);
          toast.message("Profile saved — photo upload can be added later from Settings.");
        }
      }

      if (data.weight_kg) {
        await weightService.add(pet.id, user.id, {
          weight_kg: Number(data.weight_kg),
          recorded_at: new Date().toISOString(),
          notes: "Initial weight from onboarding",
        });
      }

      const conditions = data.no_conditions
        ? []
        : data.conditions.split(",").map((s) => s.trim()).filter(Boolean);
      const allergies = data.no_allergies
        ? []
        : data.allergies.split(",").map((s) => s.trim()).filter(Boolean);

      if (conditions.length) await petService.replaceConditions(pet.id, conditions);
      if (allergies.length) await petService.replaceAllergies(pet.id, allergies);

      for (const v of data.vaccinations) {
        await vaxService.create(pet.id, {
          name: v.name,
          administered_date: v.administered_date || null,
          next_due_date: v.next_due_date || null,
        });
      }

      if (data.last_deworming) {
        await careService.create(pet.id, user.id, {
          title: "Deworming follow-up",
          category: "vet",
          frequency: "once",
          notes: `Last deworming recorded: ${data.last_deworming}`,
          next_due_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      await careService.generateDefaultCarePlan(
        pet.id,
        user.id,
        pet.name,
        data.meals_per_day ? Number(data.meals_per_day) : null
      );

      await analytics.track("onboarding_completed", user.id, pet.id, {
        species: pet.species,
        has_vaccinations: data.vaccinations.length > 0,
      });
      await analytics.track("pet_created", user.id, pet.id, { species: pet.species });
      await analytics.track("care_task_created", user.id, pet.id, { source: "default_plan" });

      localStorage.setItem("animivo_selected_pet", pet.id);
      await refreshPets();
      toast.success(`${pet.name} is ready! 🎉`);
      router.replace("/home");
    } catch (err) {
      toast.error(toUserMessage(err, `Something went wrong while creating ${data.name}'s profile.`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8 animate-fade-up">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
          Welcome to {brand.name} 🐾
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keeping your pet healthy shouldn&apos;t require remembering everything yourself.
        </p>
        <p className="mt-1 text-sm font-medium text-primary">Let&apos;s create your pet&apos;s health profile.</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {TOTAL_STEPS}</span>
          <span>{STEPS[step]}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {step === 0 && (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)]">Tell us a little about your pet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pet name *</Label>
              <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Luna" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Species</Label>
              <RadioGroup
                value={data.species}
                onValueChange={(v) => setData({ ...data, species: v as Species })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cat" id="cat" />
                  <Label htmlFor="cat">🐱 Cat</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dog" id="dog" />
                  <Label htmlFor="dog">🐶 Dog</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Breed</Label>
              <Input value={data.breed} onChange={(e) => setData({ ...data, breed: e.target.value })} placeholder="British Shorthair" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Profile photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setData({ ...data, photoFile: e.target.files?.[0] ?? null })}
                className="rounded-xl"
              />
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Pet preview" className="mt-2 h-24 w-24 rounded-2xl object-cover" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={data.use_approximate_age}
                onCheckedChange={(c) => setData({ ...data, use_approximate_age: !!c })}
              />
              <Label>I don&apos;t know the exact date of birth</Label>
            </div>
            {!data.use_approximate_age ? (
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input type="date" value={data.birth_date} onChange={(e) => setData({ ...data, birth_date: e.target.value })} className="rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Approx. years</Label>
                  <Input type="number" min={0} value={data.estimated_age_years} onChange={(e) => setData({ ...data, estimated_age_years: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Approx. months</Label>
                  <Input type="number" min={0} max={11} value={data.estimated_age_months} onChange={(e) => setData({ ...data, estimated_age_months: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select value={data.sex} onValueChange={(v) => setData({ ...data, sex: v as Sex })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Health basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={data.weight_kg} onChange={(e) => setData({ ...data, weight_kg: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Neutered/spayed</Label>
                <Select value={data.neutered} onValueChange={(v) => setData({ ...data, neutered: v as NeuteredStatus })}>
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
              <Select value={data.activity_level} onValueChange={(v) => setData({ ...data, activity_level: v as ActivityLevel })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — mostly lounging</SelectItem>
                  <SelectItem value="moderate">Moderate — regular walks/play</SelectItem>
                  <SelectItem value="high">High — very active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={data.no_conditions} onCheckedChange={(c) => setData({ ...data, no_conditions: !!c })} />
                <Label>No known conditions</Label>
              </div>
              {!data.no_conditions && (
                <Textarea
                  value={data.conditions}
                  onChange={(e) => setData({ ...data, conditions: e.target.value })}
                  placeholder="e.g. Arthritis, Diabetes (comma-separated)"
                  className="rounded-xl"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={data.no_allergies} onCheckedChange={(c) => setData({ ...data, no_allergies: !!c })} />
                <Label>No known allergies</Label>
              </div>
              {!data.no_allergies && (
                <Textarea
                  value={data.allergies}
                  onChange={(e) => setData({ ...data, allergies: e.target.value })}
                  placeholder="e.g. Chicken, Pollen (comma-separated)"
                  className="rounded-xl"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Food & nutrition</CardTitle>
            <p className="text-sm text-muted-foreground">Optional — you can always add this later</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Food brand</Label>
                <Input value={data.food_brand} onChange={(e) => setData({ ...data, food_brand: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Input value={data.food_product} onChange={(e) => setData({ ...data, food_product: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Food type</Label>
                <Select value={data.food_type} onValueChange={(v) => setData({ ...data, food_type: v as FoodType })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">Dry</SelectItem>
                    <SelectItem value="wet">Wet</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meals per day</Label>
                <Input type="number" value={data.meals_per_day} onChange={(e) => setData({ ...data, meals_per_day: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daily target</Label>
                <Input type="number" value={data.daily_food_target} onChange={(e) => setData({ ...data, daily_food_target: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={data.food_unit} onValueChange={(v) => setData({ ...data, food_unit: v as FoodUnit })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">Grams</SelectItem>
                    <SelectItem value="cans">Cans</SelectItem>
                    <SelectItem value="portions">Portions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)]">Preventive care</CardTitle>
            <p className="text-sm text-muted-foreground">Optional — skip anything you&apos;re unsure about.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>When was the last vaccination?</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder="Vaccine name" className="rounded-xl" />
                <Input type="date" value={vaxGiven} onChange={(e) => setVaxGiven(e.target.value)} className="rounded-xl" aria-label="Date administered" />
                <Input type="date" value={vaxDue} onChange={(e) => setVaxDue(e.target.value)} className="rounded-xl" aria-label="Next due date" />
              </div>
              <Button type="button" variant="secondary" onClick={addVaccination} className="rounded-xl">Add vaccination</Button>
            </div>
            {data.vaccinations.length > 0 && (
              <ul className="space-y-2">
                {data.vaccinations.map((v, i) => (
                  <li key={i} className="rounded-xl bg-secondary/50 p-3 text-sm">
                    {v.name}
                    {v.administered_date ? ` · given ${v.administered_date}` : ""}
                    {v.next_due_date ? ` · due ${v.next_due_date}` : ""}
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2">
              <Label>When was the last deworming?</Label>
              <Input
                type="date"
                value={data.last_deworming}
                onChange={(e) => setData({ ...data, last_deworming: e.target.value })}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Leave blank if unknown.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] flex items-center gap-2">
              {speciesEmoji(data.species)} {data.name || "Your pet"} is ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ve prepared {data.name}&apos;s health profile. Now let&apos;s make caring for{" "}
              {data.sex === "female" ? "her" : data.sex === "male" ? "him" : "them"} easier.
            </p>
            <ul className="space-y-2 rounded-2xl bg-secondary/40 p-4 text-sm">
              <li>{speciesEmoji(data.species)} {data.name}</li>
              {data.breed && <li>{data.breed}</li>}
              {data.sex && <li className="capitalize">{data.sex}</li>}
              {(data.birth_date || data.use_approximate_age) && <li>{summaryAge.label} old</li>}
              {data.weight_kg && <li>{data.weight_kg} kg</li>}
              {data.activity_level && <li className="capitalize">{data.activity_level} activity</li>}
            </ul>
            <Button onClick={finish} disabled={saving} className="w-full rounded-2xl" size="lg">
              {saving ? "Creating care plan…" : `Create ${data.name || "your pet"}'s Care Plan`}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={back} className="rounded-xl">Back</Button>
        ) : (
          <div />
        )}
        {step < TOTAL_STEPS - 1 && (
          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="ghost" onClick={next} className="rounded-xl">Skip</Button>
            )}
            <Button onClick={next} className="rounded-xl">Continue</Button>
          </div>
        )}
      </div>
    </div>
  );
}
