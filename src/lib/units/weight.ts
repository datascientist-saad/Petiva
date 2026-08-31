import type { Pet, WeightRecord } from "@/types/database";
import { getSpeciesDefinition } from "@/lib/species/registry";

export function petWeightGrams(pet: Pick<Pet, "species" | "weight_kg" | "weight_grams">): number | null {
  if (pet.weight_grams != null) return Number(pet.weight_grams);
  if (pet.weight_kg == null) return null;
  const def = getSpeciesDefinition(pet.species);
  if (def.defaultWeightUnit === "g") return Math.round(Number(pet.weight_kg) * 1000);
  return null;
}

export function formatPetWeight(pet: Pick<Pet, "species" | "weight_kg" | "weight_grams">): string | null {
  const def = getSpeciesDefinition(pet.species);
  if (def.defaultWeightUnit === "g") {
    const grams = petWeightGrams(pet);
    return grams != null ? `${grams} g` : null;
  }
  if (pet.weight_kg != null) return `${Number(pet.weight_kg)} kg`;
  return null;
}

export function formatWeightRecord(
  species: string,
  record: Pick<WeightRecord, "weight_kg">
): string {
  const def = getSpeciesDefinition(species);
  if (def.defaultWeightUnit === "g") {
    return `${Math.round(Number(record.weight_kg) * 1000)} g`;
  }
  return `${Number(record.weight_kg)} kg`;
}

export function weightTrendLabel(
  species: string,
  records: WeightRecord[]
): { current: string | null; change: string | null } {
  if (!records.length) return { current: null, change: null };
  const sorted = [...records].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const current = formatWeightRecord(species, latest);
  if (!previous) return { current, change: null };

  const def = getSpeciesDefinition(species);
  const latestVal = def.defaultWeightUnit === "g" ? Number(latest.weight_kg) * 1000 : Number(latest.weight_kg);
  const prevVal = def.defaultWeightUnit === "g" ? Number(previous.weight_kg) * 1000 : Number(previous.weight_kg);
  const diff = latestVal - prevVal;
  const unit = def.defaultWeightUnit === "g" ? "g" : "kg";
  const sign = diff > 0 ? "+" : "";
  const decimals = def.defaultWeightUnit === "g" ? 0 : 1;
  return {
    current,
    change: `${sign}${diff.toFixed(decimals)} ${unit} since last check`,
  };
}
