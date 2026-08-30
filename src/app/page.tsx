import { MarketingShell } from "@/components/layout/marketing-shell";
import { PreSignupWizard } from "@/components/onboarding/pre-signup-wizard";

export default function HomePage() {
  return (
    <MarketingShell>
      <PreSignupWizard />
    </MarketingShell>
  );
}
