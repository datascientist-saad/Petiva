import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/legal-page";
import { brand } from "@/lib/brand";
import { legalConfig, legalEmail } from "@/lib/legal/config";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy Policy",
  description: `How ${brand.name} collects, uses, and deletes account and pet data.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {legalConfig.serviceName} (“we”) is a pet-care organization service. This policy explains what
        we collect, why we collect it, and the choices you have. It is written for a public launch and
        is not a claim of regulatory certification.
      </p>
      <p>
        The service is operated by {legalConfig.operatorName.value}
        {!legalConfig.operatorName.confirmed ? " (legal entity name to be confirmed)" : ""}. Contact:{" "}
        <a className="text-primary underline-offset-2 hover:underline" href={`mailto:${legalEmail()}`}>
          {legalEmail()}
        </a>
        {!legalConfig.supportEmail.confirmed
          ? " — confirm this mailbox is monitored before treating it as the official support address."
          : ""}
      </p>

      <h2 className="pt-2 text-xl font-semibold">Types of data we collect</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Account details: name, email, and authentication credentials handled by Supabase Auth.</li>
        <li>Pet profiles: species, optional breed, weight, life stage or date of birth, lifestyle, and food notes you enter.</li>
        <li>Care logs: meals, weight, vaccinations, medications, symptoms, and tasks.</li>
        <li>Medical-file uploads you choose to store, including optional documents and photos.</li>
        <li>AI-chat messages and the pet context you select when using {brand.aiName}.</li>
        <li>Analytics and cookies used to understand product usage, without selling your data.</li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold">How we use data</h2>
      <p>
        We use your data to operate your dashboard, generate starting-point nutrition estimates, send
        reminders you enable, and — when you use AI — provide educational answers. We do not sell
        personal data.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Processors</h2>
      <p>
        Account and pet records are processed in Supabase (authentication, database, and private
        storage). The application is hosted on Vercel, which may process basic analytics and
        performance data. If OpenAI is configured, relevant pet-profile summaries and chat messages
        may be sent to generate responses. If OpenAI is not configured, AI features fall back to
        on-device / server-side educational replies.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Retention and deletion</h2>
      <p>
        We keep account and pet data while your account is active. You can delete pets and request
        account deletion from Settings. Deletion removes pets you own, related logs, uploaded medical
        files, and AI conversations associated with those records. Authentication sessions are ended.
      </p>

      <h2 className="pt-2 text-xl font-semibold">International processing</h2>
      <p>
        Your information may be processed in the countries where our hosting and database providers
        operate. We apply contractual and access controls, but no internet service can promise
        absolute security.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, export, or delete
        personal data. Email {legalEmail()} to make a request. The minimum intended account age is{" "}
        {legalConfig.minimumAge.value}
        {!legalConfig.minimumAge.confirmed ? " (to be confirmed)" : ""}.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Veterinary and emergency limits</h2>
      <p>
        {brand.name} does not diagnose, treat, or provide emergency care. Nutrition estimates are
        starting points. If an animal is in distress, contact a veterinarian or emergency clinic.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Changes</h2>
      <p>
        We may update this policy as the product changes. The last-updated date at the top of this
        page will change when we do. See also our{" "}
        <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/ai-disclaimer" className="text-primary underline-offset-2 hover:underline">
          AI Disclaimer
        </Link>
        .
      </p>
    </LegalPage>
  );
}
