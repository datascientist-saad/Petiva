import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Logo />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back
        </Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">Terms of Use</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
          <p>
            Welcome to {brand.name}. By using this pilot application you agree to these terms.
          </p>
          <h2 className="pt-2 text-xl font-semibold">Not veterinary care</h2>
          <p>
            {brand.name} is a care-organization tool. It does not provide veterinary diagnosis,
            treatment, or emergency services. Always consult a licensed veterinarian for medical
            decisions about your pet.
          </p>
          <h2 className="pt-2 text-xl font-semibold">Your responsibilities</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Provide accurate information about your pets</li>
            <li>Keep account credentials secure</li>
            <li>Only upload documents you have the right to store</li>
            <li>Use the AI assistant as educational support, not as a clinician</li>
          </ul>
          <h2 className="pt-2 text-xl font-semibold">Pilot availability</h2>
          <p>
            This is an early pilot. Features may change, and service availability is not guaranteed.
          </p>
          <h2 className="pt-2 text-xl font-semibold">Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, {brand.name} is provided “as is” without
            warranties regarding health outcomes. You remain responsible for your pet&apos;s care.
          </p>
          <p>
            Questions? Email {brand.supportEmail}.
          </p>
        </div>
      </main>
    </div>
  );
}
