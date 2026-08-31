export const DOG_BREEDS = [
  "Mixed breed",
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "French Bulldog",
  "Bulldog",
  "Poodle",
  "Beagle",
  "Rottweiler",
  "Yorkshire Terrier",
  "Dachshund",
  "Boxer",
  "I'm not sure",
] as const;

export const CAT_BREEDS = [
  "Mixed breed",
  "Domestic Shorthair",
  "Domestic Longhair",
  "British Shorthair",
  "Maine Coon",
  "Persian",
  "Ragdoll",
  "Siamese",
  "Bengal",
  "Sphynx",
  "Scottish Fold",
  "I'm not sure",
] as const;

import type { SupportedSpeciesId } from "@/lib/species/registry";
import { BIRD_SPECIES_OPTIONS } from "@/lib/species/bird-breeds";

export function breedsForSpecies(species: SupportedSpeciesId): readonly string[] {
  if (species === "bird") return BIRD_SPECIES_OPTIONS;
  return species === "dog" ? DOG_BREEDS : CAT_BREEDS;
}
