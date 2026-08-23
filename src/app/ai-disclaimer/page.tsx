import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export const metadata = { title: "AI Disclaimer" };

export default function AiDisclaimerPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Logo />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back
        </Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">AI Disclaimer</h1>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
          <p className="rounded-2xl border border-accent/30 bg-accent/10 p-4 font-medium">
            {brand.name} AI provides general pet-care information and does not replace a veterinarian.
          </p>
          <p>
            The assistant may use details from the pet profile you selected (species, breed, age,
            weight, conditions, allergies, medications, symptoms, and vaccination records) to make
            answers more relevant.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>It does not diagnose diseases</li>
            <li>It does not prescribe medications</li>
            <li>It does not invent dosages</li>
            <li>Emergency-sounding symptoms should be treated as urgent — contact a vet or emergency clinic</li>
          </ul>
          <p>
            Always verify care decisions with a licensed veterinary professional. See also our{" "}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
              Terms
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
