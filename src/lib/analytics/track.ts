import { track as vercelTrack } from "@vercel/analytics";
import { SENSITIVE_ANALYTICS_KEYS, type AnalyticsEventName } from "./events";

function stripSensitive(metadata: Record<string, unknown>): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_ANALYTICS_KEYS.some((blocked) => key.toLowerCase().includes(blocked.toLowerCase()))) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

/** Client-side, privacy-conscious analytics. Never send names, medical data, or emails. */
export function trackEvent(event: AnalyticsEventName, metadata: Record<string, unknown> = {}) {
  try {
    vercelTrack(event, stripSensitive(metadata));
  } catch {
    // Analytics must never break the product flow.
  }
}
