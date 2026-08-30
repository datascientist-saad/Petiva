import { PreSignupWizard } from "@/components/onboarding/pre-signup-wizard";

export const metadata = {
  title: "Get started",
  description: "Create your pet's personalized care and diet plan before signing up.",
};

export default function GetStartedPage() {
  return <PreSignupWizard />;
}
