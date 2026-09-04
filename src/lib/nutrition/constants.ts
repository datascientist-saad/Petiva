/**
 * Veterinary energy-estimation constants for dogs and cats.
 *
 * These values are educational starting points compiled from publicly
 * documented veterinary nutrition guidance, including:
 *
 * - Merck / MSD Veterinary Manual, “Nutritional Requirements and Related
 *   Diseases of Small Animals” and energy-requirement tables
 * - AAHA 2021 Nutrition and Weight Management Guidelines
 * - NRC Nutrient Requirements of Dogs and Cats (resting energy equation)
 *
 * Animivo has not completed an independent veterinary review of this module.
 * Do not describe results as “veterinarian approved.”
 *
 * Pipeline (one adjustment path — do not stack overlapping lifestyle factors):
 *   1. RER = 70 × weightKg^0.75
 *   2. Choose a single base maintenance factor from species + life stage +
 *      reproductive status. Puppy/kitten factors replace adult factors.
 *   3. For adults only, refine that base with activity (activity does not
 *      multiply on top of a growth factor).
 *   4. Apply one body-condition / diet-goal adjustment.
 *   5. Report a conservative range around the central estimate.
 */

export const NUTRITION_ENGINE_VERSION = "2026.09.04";

export const RER_COEFFICIENT = 70;
export const RER_EXPONENT = 0.75;

/** 1 pound = 0.45359237 kilograms (international avoirdupois pound). */
export const KG_PER_LB = 0.45359237;

export const WEIGHT_LIMITS = {
  dog: { minKg: 0.5, maxKg: 90, implausibleKg: 120 },
  cat: { minKg: 0.3, maxKg: 15, implausibleKg: 25 },
} as const;

/**
 * Base MER factors already include typical adult household activity.
 * Select one row. Do not multiply these by a second “lifestyle” table.
 *
 * Sources: Merck/MSD Veterinary Manual energy tables; AAHA 2021 guidelines.
 */
export const BASE_MER_FACTORS = {
  dog: {
    baby: 3.0,
    young: 2.0,
    adult_intact: 1.8,
    adult_neutered: 1.6,
    adult_unknown: 1.6,
    senior_intact: 1.6,
    senior_neutered: 1.4,
    senior_unknown: 1.4,
  },
  cat: {
    baby: 2.5,
    young: 2.0,
    adult_intact: 1.4,
    adult_neutered: 1.2,
    adult_unknown: 1.2,
    senior_intact: 1.2,
    senior_neutered: 1.1,
    senior_unknown: 1.1,
  },
} as const;

/**
 * Adult-only activity refinement. Applied instead of stacking a second
 * full lifestyle multiplier. Values are deltas from the selected adult base.
 */
export const ADULT_ACTIVITY_DELTA = {
  dog: {
    low: -0.2,
    moderate: 0,
    active: 0.2,
    very_active: 0.4,
  },
  cat: {
    low: -0.1,
    moderate: 0,
    active: 0.1,
    very_active: 0.2,
  },
} as const;

/**
 * Single body-condition / goal adjustment. Diet goal takes precedence when
 * both a goal and a body-condition signal are present so they are not
 * multiplied together.
 */
export const GOAL_ADJUSTMENT = {
  lose: 0.8,
  gain: 1.15,
  maintain: 1.0,
  improve: 1.0,
} as const;

export const BODY_CONDITION_ADJUSTMENT = {
  underweight: 1.1,
  overweight: 0.9,
  ideal: 1.0,
  unsure: 1.0,
} as const;

export const RANGE_FACTOR = { min: 0.9, max: 1.1 } as const;

export const TREAT_ALLOWANCE_FRACTION = 0.1;

export const HIGH_RISK_CONDITION_TERMS = [
  "diabetes",
  "kidney",
  "renal",
  "heart disease",
  "cardiac",
  "liver",
  "pancreatitis",
  "cancer",
  "hyperthyroid",
  "hypothyroid",
  "ibd",
  "pregnancy",
  "pregnant",
  "nursing",
  "lactating",
] as const;

export const NUTRITION_SAFETY_NOTICE =
  "This is an estimate and a starting point, not a prescription. Monitor weight and body condition, and consult a veterinarian for individualized recommendations. Animivo does not diagnose or treat animals, and this plan has not been medically approved by AI or a veterinarian.";

export const HIGH_RISK_ESCALATION =
  "This situation needs professional veterinary review before a routine feeding plan is used. Pregnancy, nursing, very young animals, kidney disease, diabetes, heart disease, and severe underweight or overweight are not appropriate for automated calorie targets.";

export const UNSUPPORTED_SPECIES_NOTICE =
  "A personalized calorie or feeding-quantity calculation is not available for this species yet. Animivo can still help you organize care records. Ask a veterinarian who knows this species for dietary quantities.";
