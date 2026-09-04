/**
 * Life-stage resolution for companion animals.
 *
 * Age is never inferred as zero. Puppy/kitten multipliers are applied only when
 * the user explicitly selected a juvenile life stage or provided a valid date
 * of birth that places the animal in that stage.
 */

export type ApproximateLifeStage = "baby" | "young" | "adult" | "senior" | "unknown";

export type ResolvedLifeStage = "baby" | "young" | "adult" | "senior";

export const LIFE_STAGE_LABELS: Record<
  ApproximateLifeStage,
  { dog: string; cat: string; bird: string; generic: string }
> = {
  baby: { dog: "Puppy", cat: "Kitten", bird: "Chick / young bird", generic: "Baby" },
  young: { dog: "Young", cat: "Young", bird: "Young", generic: "Young" },
  adult: { dog: "Adult", cat: "Adult", bird: "Adult", generic: "Adult" },
  senior: { dog: "Senior", cat: "Senior", bird: "Senior", generic: "Senior" },
  unknown: { dog: "Age unknown", cat: "Age unknown", bird: "Age unknown", generic: "Age unknown" },
};

const MAX_PLAUSIBLE_AGE_YEARS: Record<string, number> = {
  dog: 22,
  cat: 25,
  bird: 80,
};

export function lifeStageLabel(stage: ApproximateLifeStage | null | undefined, species?: string): string {
  const key = stage ?? "unknown";
  const labels = LIFE_STAGE_LABELS[key] ?? LIFE_STAGE_LABELS.unknown;
  if (species === "dog") return labels.dog;
  if (species === "cat") return labels.cat;
  if (species === "bird") return labels.bird;
  return labels.generic;
}

export function isValidBirthDate(value: string | null | undefined, now = new Date(), species = "dog"): boolean {
  if (!value) return false;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return false;
  if (birth.getTime() > now.getTime()) return false;
  const maxYears = MAX_PLAUSIBLE_AGE_YEARS[species] ?? 30;
  const oldest = new Date(now);
  oldest.setFullYear(oldest.getFullYear() - maxYears);
  if (birth.getTime() < oldest.getTime()) return false;
  return true;
}

export function ageMonthsFromBirthDate(birthDate: string, now = new Date()): number {
  const birth = new Date(birthDate);
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

export function deriveLifeStageFromAgeMonths(species: string, ageMonths: number): ResolvedLifeStage {
  if (species === "cat") {
    if (ageMonths < 6) return "baby";
    if (ageMonths < 12) return "young";
    if (ageMonths >= 11 * 12) return "senior";
    return "adult";
  }
  if (species === "dog") {
    if (ageMonths < 4) return "baby";
    if (ageMonths < 12) return "young";
    if (ageMonths >= 8 * 12) return "senior";
    return "adult";
  }
  if (species === "bird") {
    if (ageMonths < 6) return "baby";
    if (ageMonths < 12) return "young";
    if (ageMonths >= 8 * 12) return "senior";
    return "adult";
  }
  if (ageMonths < 6) return "baby";
  if (ageMonths < 12) return "young";
  if (ageMonths >= 8 * 12) return "senior";
  return "adult";
}

export interface LifeStageResolution {
  stage: ResolvedLifeStage;
  source: "explicit" | "date_of_birth" | "estimated_age" | "conservative_adult";
  ageMonths: number | null;
  assumption: string | null;
  usedJuvenileMultiplier: boolean;
}

export function resolveLifeStage(input: {
  species: string;
  lifeStage?: ApproximateLifeStage | null;
  birthDate?: string | null;
  estimatedAgeMonths?: number | null;
  now?: Date;
}): LifeStageResolution {
  const now = input.now ?? new Date();
  const explicit = input.lifeStage && input.lifeStage !== "unknown" ? input.lifeStage : null;

  if (isValidBirthDate(input.birthDate, now, input.species)) {
    const ageMonths = ageMonthsFromBirthDate(input.birthDate as string, now);
    const derived = deriveLifeStageFromAgeMonths(input.species, ageMonths);
    return {
      stage: derived,
      source: "date_of_birth",
      ageMonths,
      assumption: null,
      usedJuvenileMultiplier: derived === "baby" || derived === "young",
    };
  }

  if (explicit) {
    return {
      stage: explicit,
      source: "explicit",
      ageMonths:
        typeof input.estimatedAgeMonths === "number" && input.estimatedAgeMonths > 0
          ? input.estimatedAgeMonths
          : null,
      assumption: null,
      usedJuvenileMultiplier: explicit === "baby" || explicit === "young",
    };
  }

  if (typeof input.estimatedAgeMonths === "number" && input.estimatedAgeMonths > 0) {
    const derived = deriveLifeStageFromAgeMonths(input.species, input.estimatedAgeMonths);
    return {
      stage: derived,
      source: "estimated_age",
      ageMonths: input.estimatedAgeMonths,
      assumption: "Life stage was inferred from the approximate age you entered.",
      usedJuvenileMultiplier: derived === "baby" || derived === "young",
    };
  }

  return {
    stage: "adult",
    source: "conservative_adult",
    ageMonths: null,
    assumption: "Age was unknown, so an adult maintenance estimate was used.",
    usedJuvenileMultiplier: false,
  };
}

export function formatAgeDisplay(input: {
  species?: string;
  birthDate?: string | null;
  lifeStage?: ApproximateLifeStage | null;
  estimatedAgeMonths?: number | null;
  now?: Date;
}): { label: string; totalMonths: number | null; years: number | null; months: number | null } {
  const now = input.now ?? new Date();
  if (isValidBirthDate(input.birthDate, now, input.species ?? "dog")) {
    const totalMonths = ageMonthsFromBirthDate(input.birthDate as string, now);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const label =
      years <= 0
        ? `${months} mo`
        : months === 0
          ? `${years} ${years === 1 ? "year" : "years"}`
          : `${years} ${years === 1 ? "year" : "years"}`;
    return { label, totalMonths, years, months };
  }

  if (input.lifeStage && input.lifeStage !== "unknown") {
    return {
      label: lifeStageLabel(input.lifeStage, input.species),
      totalMonths: input.estimatedAgeMonths && input.estimatedAgeMonths > 0 ? input.estimatedAgeMonths : null,
      years: null,
      months: null,
    };
  }

  if (input.estimatedAgeMonths && input.estimatedAgeMonths > 0) {
    const years = Math.floor(input.estimatedAgeMonths / 12);
    const months = input.estimatedAgeMonths % 12;
    const label =
      years <= 0
        ? `~${months} mo`
        : months === 0
          ? `~${years} ${years === 1 ? "year" : "years"}`
          : `~${years} ${years === 1 ? "year" : "years"}`;
    return { label, totalMonths: input.estimatedAgeMonths, years, months };
  }

  return { label: "Age unknown", totalMonths: null, years: null, months: null };
}
