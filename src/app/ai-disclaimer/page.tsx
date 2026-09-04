import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/legal-page";
import { brand } from "@/lib/brand";
import { legalEmail } from "@/lib/legal/config";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "AI Disclaimer",
  description: `What ${brand.name} AI can and cannot do, and how to get help in an emergency.`,
  path: "/ai-disclaimer",
});

export default function AiDisclaimerPage() {
  return (
    <LegalPage title="AI Disclaimer">
      <p className="rounded-2xl border border-accent/30 bg-accent/10 p-4 font-medium">
        {brand.aiName} provides general pet-care information. It does not diagnose or treat animals
        and does not replace a licensed veterinarian.
      </p>

      <h2 className="pt-2 text-xl font-semibold">What the AI features do</h2>
      <p>
        {brand.aiName} can explain records you have entered, summarize a selected pet profile, and
        offer educational care questions to discuss with a veterinarian. Numerical diet amounts for
        dogs and cats come from a documented calculator, not from the language model inventing
        calories.
      </p>

      <h2 className="pt-2 text-xl font-semibold">What data may be processed</h2>
      <p>
        When you send a message, the assistant may use the selected pet’s species, breed, age or life
        stage, weight, conditions, allergies, medications, symptoms, and vaccination notes. If OpenAI
        is enabled, that context and your message may be sent to OpenAI to generate a reply. Chat
        text is stored in your account so you can continue a conversation.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Accuracy and medical limits</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>AI output may be inaccurate or incomplete</li>
        <li>{brand.name} does not diagnose or treat animals</li>
        <li>AI guidance does not replace a licensed veterinarian</li>
        <li>Nutrition estimates are starting points, not prescriptions</li>
        <li>High-risk conditions require professional veterinary review</li>
        <li>AI has not medically approved any plan</li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold">Emergencies</h2>
      <p>
        If an animal is having trouble breathing, collapsing, seizing, bleeding heavily, or otherwise
        appears in danger, contact a veterinarian or emergency clinic immediately. {brand.name} is
        not an emergency service.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Report an incorrect or unsafe output</h2>
      <p>
        Email {legalEmail()} with a short description of what you asked and why the reply seemed
        wrong or unsafe. Do not include extra medical documents unless needed. We use reports to
        improve safety messaging.
      </p>

      <p>
        See also our{" "}
        <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
          Terms of Use
        </Link>
        .
      </p>
    </LegalPage>
  );
}
