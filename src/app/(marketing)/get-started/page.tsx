import type { Metadata } from "next";
import { PreSignupWizard } from "@/components/onboarding/pre-signup-wizard";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Create your pet’s plan",
  description: "Answer a few questions about your pet to preview a personalized starting care plan.",
  path: "/get-started",
});

export default function GetStartedPage() {
  return <PreSignupWizard />;
}
