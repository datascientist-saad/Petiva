import { getBirdDietReference, BIRD_NUTRITION_REFERENCE_VERSION } from "./bird-reference-data";

export interface BirdNutritionInput {
  birdSpecies: string;
  weightGrams: number;
  ageMonths: number;
  activityLevel: "low" | "moderate" | "active" | "very_active";
  pelletPercentCurrent?: number | null;
  seedPercentCurrent?: number | null;
  vegetablePercentCurrent?: number | null;
  fruitPercentCurrent?: number | null;
  eggLaying?: boolean;
  featherPluckingHistory?: boolean;
  healthFlags?: string[];
}

export interface BirdNutritionResult {
  engineVersion: string;
  referenceVersion: string;
  isGeneralGuidance: boolean;
  suggestedPelletPercent: { min: number; max: number };
  suggestedSeedPercentMax: number;
  suggestedVegetablePercentMin: number;
  suggestedFruitPercentMax: number;
  treatGuidance: string;
  feedingSchedule: { label: string; detail: string }[];
  waterSchedule: string;
  weightMonitoringFrequencyDays: number;
  personalBaselineGrams: number | null;
  foodTransitionWeeks: number;
  enrichmentTips: string[];
  unsafeFoodWarnings: string[];
  influencingFactors: string[];
  limitations: string[];
  avianVetDisclaimer: string;
  elevatedVetWarning: boolean;
}

export function gramsFromKg(kg: number): number {
  return Math.round(kg * 1000);
}

export function kgFromGrams(grams: number): number {
  return grams / 1000;
}

export function calculateBirdNutrition(input: BirdNutritionInput): BirdNutritionResult {
  const ref = getBirdDietReference(input.birdSpecies);
  const influencingFactors: string[] = [];
  const limitations: string[] = [];
  let elevatedVetWarning = false;

  if (input.weightGrams <= 0) {
    limitations.push("Weight is required for personalized monitoring guidance.");
  } else {
    influencingFactors.push(`Current weight: ${input.weightGrams} g`);
  }

  if (input.ageMonths < 6) {
    influencingFactors.push("Young bird — growth needs may differ");
    limitations.push("Growing birds may need species-specific veterinary guidance.");
  } else if (input.ageMonths >= 84) {
    influencingFactors.push("Senior life stage");
  }

  influencingFactors.push(`Activity: ${input.activityLevel}`);

  if (input.eggLaying) {
    elevatedVetWarning = true;
    influencingFactors.push("Egg-laying noted");
    limitations.push("Laying birds may need calcium and nutrition reviewed by an avian vet.");
  }

  if (input.featherPluckingHistory) {
    elevatedVetWarning = true;
    influencingFactors.push("Feather-plucking history");
    limitations.push("Feather condition concerns should be assessed by an avian veterinarian.");
  }

  for (const flag of input.healthFlags ?? []) {
    if (/kidney|liver|obesity|underweight|regurgitat/i.test(flag)) {
      elevatedVetWarning = true;
      influencingFactors.push(`Health flag: ${flag}`);
    }
  }

  if ((input.seedPercentCurrent ?? 0) > ref.seedPercentMax) {
    influencingFactors.push("Current seed proportion above recommended maximum");
    limitations.push("Transition gradually from seed-heavy diets with veterinary oversight.");
  }

  const meals =
    input.activityLevel === "very_active" || input.activityLevel === "active" ? 3 : ref.mealsPerDay;

  return {
    engineVersion: "bird-v1",
    referenceVersion: BIRD_NUTRITION_REFERENCE_VERSION,
    isGeneralGuidance: input.birdSpecies === "Other companion bird" || limitations.length > 0,
    suggestedPelletPercent: { min: ref.pelletPercentMin, max: ref.pelletPercentMax },
    suggestedSeedPercentMax: ref.seedPercentMax,
    suggestedVegetablePercentMin: ref.vegetablePercentMin,
    suggestedFruitPercentMax: ref.fruitPercentMax,
    treatGuidance: ref.treatGuidance,
    feedingSchedule: [
      { label: "Morning", detail: `Measured portion — ${meals} meals/day suggested` },
      { label: "Afternoon", detail: "Fresh vegetables/greens where appropriate" },
      { label: "Evening", detail: "Remove uneaten fresh food within a few hours" },
    ],
    waterSchedule: `Replace drinking water at least every ${ref.waterChangeFrequencyHours} hours.`,
    weightMonitoringFrequencyDays: ref.weightCheckFrequencyDays,
    personalBaselineGrams: input.weightGrams > 0 ? input.weightGrams : null,
    foodTransitionWeeks: ref.transitionWeeks,
    enrichmentTips: ref.enrichmentTips,
    unsafeFoodWarnings: ref.unsafeFoods,
    influencingFactors,
    limitations,
    avianVetDisclaimer: ref.disclaimer,
    elevatedVetWarning,
  };
}
