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

function supabaseErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const record = error as { message?: string; code?: string; cause?: unknown };
  if (record.code === "42501") {
    return "You don't have permission to save this. Try signing out and back in.";
  }
  if (typeof record.message === "string" && record.message.length > 0) {
    return record.message;
  }
  if (record.cause) return supabaseErrorMessage(record.cause);
  return null;
}

export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AppError) return error.message;
  const supabaseMessage = supabaseErrorMessage(error);
  if (supabaseMessage) return supabaseMessage;
  if (process.env.NODE_ENV === "development") {
    console.error("[Petiva]", error);
  }
  return fallback;
}

export function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Petiva:${context}]`, error);
  }
}
