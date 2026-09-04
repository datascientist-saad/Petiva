/**
 * Central legal and operator configuration for public pages.
 *
 * Fields marked `confirmed: false` are placeholders. Do not treat them as
 * verified company-registration facts until a founder or lawyer confirms them.
 * See docs/LEGAL_LAUNCH_CHECKLIST.md.
 */

export interface LegalField<T> {
  value: T;
  confirmed: boolean;
  notes: string;
}

export const legalConfig = {
  serviceName: "Animivo",
  effectiveDate: "2026-09-04",
  lastUpdated: "2026-09-04",
  operatorName: {
    value: "Animivo",
    confirmed: false,
    notes: "Replace with the legal entity name once the company is registered.",
  } satisfies LegalField<string>,
  supportEmail: {
    value: "hello@animivo.app",
    confirmed: false,
    notes:
      "This address is already used in brand.supportEmail. Confirm that the mailbox is monitored and intended as the official support address before launch.",
  } satisfies LegalField<string>,
  privacyContactEmail: {
    value: "hello@animivo.app",
    confirmed: false,
    notes: "Confirm a dedicated privacy contact if different from support.",
  } satisfies LegalField<string>,
  minimumAge: {
    value: 16,
    confirmed: false,
    notes: "Confirm the minimum account age with counsel for each target market.",
  } satisfies LegalField<number>,
  governingLaw: {
    value: "the laws of the jurisdiction in which the service operator is established",
    confirmed: false,
    notes: "Do not publish a specific country or state until the operator entity is confirmed.",
  } satisfies LegalField<string>,
  venue: {
    value: "the courts of competent jurisdiction where the service operator is established",
    confirmed: false,
    notes: "Placeholder only. Confirm venue with counsel.",
  } satisfies LegalField<string>,
  processors: {
    supabase: true,
    openaiOptional: true,
    vercelHosting: true,
    vercelAnalytics: true,
  },
} as const;

export function legalEmail(): string {
  return legalConfig.supportEmail.value;
}

export function formatLegalDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
