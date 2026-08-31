/**
 * Versioned reference data for bird diet composition guidance.
 * Numerical recommendations come from structured data — not LLM output.
 */
export const BIRD_NUTRITION_REFERENCE_VERSION = "2026.08.31";

export interface BirdDietReference {
  pelletPercentMin: number;
  pelletPercentMax: number;
  seedPercentMax: number;
  vegetablePercentMin: number;
  fruitPercentMax: number;
  treatGuidance: string;
  mealsPerDay: number;
  waterChangeFrequencyHours: number;
  weightCheckFrequencyDays: number;
  unsafeFoods: string[];
  enrichmentTips: string[];
  transitionWeeks: number;
  disclaimer: string;
}

const BASE_REFERENCE: BirdDietReference = {
  pelletPercentMin: 60,
  pelletPercentMax: 80,
  seedPercentMax: 10,
  vegetablePercentMin: 15,
  fruitPercentMax: 5,
  treatGuidance: "Limit treats to small portions; avoid fatty seeds as a staple.",
  mealsPerDay: 2,
  waterChangeFrequencyHours: 12,
  weightCheckFrequencyDays: 7,
  unsafeFoods: [
    "Avocado",
    "Chocolate",
    "Caffeine",
    "Alcohol",
    "Onion",
    "Garlic",
    "High-salt foods",
    "Xylitol",
    "Fruit pits and seeds (where toxic)",
  ],
  enrichmentTips: [
    "Offer foraging opportunities with safe vegetables",
    "Rotate safe toys to encourage activity",
    "Use measured portions rather than free-feeding seeds",
  ],
  transitionWeeks: 4,
  disclaimer:
    "This is general educational guidance based on common avian nutrition principles. Confirm portions, supplements, and transitions with an avian veterinarian — especially for medical conditions, breeding birds, or species with specialized needs.",
};

const SPECIES_OVERRIDES: Partial<Record<string, Partial<BirdDietReference>>> = {
  Budgie: { pelletPercentMin: 70, seedPercentMax: 5 },
  Cockatiel: { pelletPercentMin: 65, seedPercentMax: 10 },
  "African grey": { pelletPercentMin: 75, vegetablePercentMin: 20 },
  Macaw: { pelletPercentMin: 60, fruitPercentMax: 8 },
  Canary: { pelletPercentMin: 50, seedPercentMax: 20 },
  Finch: { pelletPercentMin: 50, seedPercentMax: 25 },
};

export function getBirdDietReference(birdSpecies: string): BirdDietReference {
  const override = SPECIES_OVERRIDES[birdSpecies] ?? {};
  return { ...BASE_REFERENCE, ...override };
}
