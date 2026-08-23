import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Logo />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back
        </Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
          <p>
            {brand.name} helps you keep track of your pet&apos;s care information. This policy
            explains what we collect for the pilot and how we use it.
          </p>
          <h2 className="pt-2 text-xl font-semibold">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account details (name, email, password via Supabase Auth)</li>
            <li>Pet profiles and care logs you enter (meals, weight, vaccines, medications, tasks)</li>
            <li>Optional medical file uploads you choose to store</li>
            <li>AI chat messages you send within the app</li>
            <li>Basic product analytics events to understand pilot usage</li>
          </ul>
          <h2 className="pt-2 text-xl font-semibold">How we use data</h2>
          <p>
            We use your data to power your pet dashboard, reminders, and personalized AI answers.
            We do not sell personal data. Pilot administrators may view aggregate metrics (not
            private medical document contents) to evaluate the product.
          </p>
          <h2 className="pt-2 text-xl font-semibold">AI processing</h2>
          <p>
            If OpenAI is configured, relevant pet profile summaries may be sent to generate
            responses. AI output is informational only and does not replace veterinary advice.
          </p>
          <h2 className="pt-2 text-xl font-semibold">Security</h2>
          <p>
            Access to pet data is protected with authentication and row-level security. Medical
            files are stored in a private bucket and served with signed URLs.
          </p>
          <h2 className="pt-2 text-xl font-semibold">Your choices</h2>
          <p>
            You can update profile information, delete pets, and request account deletion from
            Settings. Contact {brand.supportEmail} for pilot privacy questions.
          </p>
          <p className="text-sm text-muted-foreground">
            This MVP page is informational and does not claim regulatory certifications.
          </p>
        </div>
      </main>
    </div>
  );
}
