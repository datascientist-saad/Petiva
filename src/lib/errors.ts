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

export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AppError) return error.message;
  if (process.env.NODE_ENV === "development") {
    console.error("[Pawly]", error);
  }
  return fallback;
}

export function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Pawly:${context}]`, error);
  }
}
