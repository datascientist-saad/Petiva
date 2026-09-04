import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/legal-page";
import { brand } from "@/lib/brand";
import { legalConfig, legalEmail } from "@/lib/legal/config";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of Use",
  description: `Terms for using ${brand.name}, including veterinary limitations and account responsibilities.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        Welcome to {legalConfig.serviceName}. By creating an account or using the service you agree
        to these terms. The operator is {legalConfig.operatorName.value}
        {!legalConfig.operatorName.confirmed ? " (legal entity name to be confirmed)" : ""}.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Not veterinary care</h2>
      <p>
        {brand.name} is a care-organization tool. It does not provide veterinary diagnosis, treatment,
        prescriptions, or emergency services. Nutrition numbers are estimates and starting points.
        Always consult a licensed veterinarian for medical decisions. In an emergency, contact a
        veterinarian or emergency clinic immediately.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Your responsibilities</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Provide information you believe is accurate</li>
        <li>Keep account credentials secure</li>
        <li>Only upload documents you have the right to store</li>
        <li>Use AI features as educational support, not as a clinician</li>
        <li>Monitor your pet’s weight and body condition over time</li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold">Accounts</h2>
      <p>
        You must meet the minimum age in our Privacy Policy. You may delete your account from
        Settings. We may suspend accounts that abuse the service or other users.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Availability</h2>
      <p>
        We work to keep {brand.name} available, but we do not guarantee uninterrupted service.
        Features may change as the product improves.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {brand.name} is provided “as is” without warranties
        regarding health outcomes. You remain responsible for your pet’s care. We do not claim
        regulatory certification or that AI has medically approved any plan.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Governing law</h2>
      <p>
        These terms are governed by {legalConfig.governingLaw.value}. Disputes will be handled in{" "}
        {legalConfig.venue.value}. These jurisdiction details are placeholders until the operator
        entity is confirmed.
      </p>

      <p>
        Questions? Email {legalEmail()}. Related pages:{" "}
        <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
          Privacy Policy
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
