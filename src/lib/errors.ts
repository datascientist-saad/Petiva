export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly cause?: unknown;

  constructor(message: string, options?: { code?: string; status?: number; cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "APP_ERROR";
    this.status = options?.status ?? 400;
    this.cause = options?.cause;
  }
}

export function errorText(error: unknown): string {
  if (!error || typeof error !== "object") return String(error ?? "");
  const record = error as { message?: string; details?: string; hint?: string; code?: string; cause?: unknown };
  const parts = [record.message, record.details, record.hint, record.code].filter(Boolean);
  const nested = record.cause ? errorText(record.cause) : "";
  return [...parts, nested].filter(Boolean).join(" ");
}

function mappedConstraintMessage(error: unknown): string | null {
  if (!error) return null;
  const record = error && typeof error === "object" ? (error as { code?: string; cause?: unknown }) : null;
  if (record?.code === "42501") {
    return "You don't have permission to save this. Try signing out and back in.";
  }
  const text = errorText(error);
  if (/42501/.test(text) && /permission|rls|policy/i.test(text)) {
    return "You don't have permission to save this. Try signing out and back in.";
  }
  if (/pets_species_check|species.*\(.*cat.*dog.*\)/i.test(text)) {
    return "Bird profiles need a database update before they can be saved. Apply the latest Supabase migrations and try again.";
  }
  if (/pets_weight_unit_check|violates check constraint.*weight_unit/i.test(text)) {
    return "Bird weight in grams could not be saved. Apply the latest database migration and try again.";
  }
  if (record?.cause) return mappedConstraintMessage(record.cause);
  return null;
}

function supabaseErrorMessage(error: unknown): string | null {
  const mapped = mappedConstraintMessage(error);
  if (mapped) return mapped;
  if (!error || typeof error !== "object") return null;
  const record = error as { message?: string; cause?: unknown };
  if (typeof record.message === "string" && record.message.length > 0) {
    return record.message;
  }
  if (record.cause) return supabaseErrorMessage(record.cause);
  return null;
}

export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const mapped = mappedConstraintMessage(error);
  if (mapped) return mapped;
  if (error instanceof AppError) {
    const fromCause = mappedConstraintMessage(error.cause);
    if (fromCause) return fromCause;
    return error.message;
  }
  const supabaseMessage = supabaseErrorMessage(error);
  if (supabaseMessage) return supabaseMessage;
  if (process.env.NODE_ENV === "development") {
    console.error("[Animivo]", error);
  }
  return fallback;
}

export function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Animivo:${context}]`, error);
  }
}
