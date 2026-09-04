import { errorText } from "@/lib/errors";

const REQUIRED_PET_COLUMNS = new Set(["name", "species", "owner_id"]);

/** Columns added after the original pets table. Safe to insert without, then patch. */
export const OPTIONAL_PET_INSERT_COLUMNS = ["life_stage"] as const;

function withoutKey<T extends object>(input: T, key: keyof T): T {
  const next = { ...input };
  delete next[key];
  return next;
}

export function missingColumnName(text: string): string | null {
  const match =
    text.match(/Could not find the ['"]([^'"]+)['"] column/i) ||
    text.match(/column ['"]([^'"]+)['"] does not exist/i) ||
    text.match(/column (?:[\w]+\.)+([\w]+) does not exist/i) ||
    text.match(/column ([a-z_]+) does not exist/i);
  return match?.[1] ?? null;
}

export function stripOptionalPetInsertColumns<T extends Record<string, unknown>>(input: T): {
  core: T;
  extra: Partial<T>;
} {
  const core = { ...input };
  const extra: Partial<T> = {};
  for (const key of OPTIONAL_PET_INSERT_COLUMNS) {
    if (key in core) {
      extra[key as keyof T] = core[key as keyof T];
      delete core[key as keyof T];
    }
  }
  return { core, extra };
}

/**
 * Returns a slightly looser payload to retry after a schema-drift or leftover
 * check-constraint error. Returns null when another attempt cannot help.
 */
export function nextPetWriteAttempt<T extends Record<string, unknown>>(
  attempt: T,
  error: unknown
): T | null {
  const text = errorText(error);
  const column = missingColumnName(text);
  if (column && !REQUIRED_PET_COLUMNS.has(column) && column in attempt) {
    return withoutKey(attempt, column as keyof T);
  }

  if (/weight_unit/i.test(text) && attempt.weight_unit === "g") {
    return { ...attempt, weight_unit: "kg" };
  }

  if (/pets_sex_check|(?:constraint|check).*sex/i.test(text) && attempt.sex === "unknown") {
    return { ...attempt, sex: null };
  }

  if (/life_stage/i.test(text) && "life_stage" in attempt) {
    return withoutKey(attempt, "life_stage" as keyof T);
  }

  if (/weight_grams/i.test(text) && "weight_grams" in attempt) {
    return withoutKey(attempt, "weight_grams" as keyof T);
  }

  if (/species_profile/i.test(text) && "species_profile" in attempt) {
    return withoutKey(attempt, "species_profile" as keyof T);
  }

  if (/calculation_version/i.test(text) && "calculation_version" in attempt) {
    return withoutKey(attempt, "calculation_version" as keyof T);
  }

  return null;
}
