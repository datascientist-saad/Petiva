import { MarketingShell } from "@/components/layout/marketing-shell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell variant="onboarding">{children}</MarketingShell>;
}
