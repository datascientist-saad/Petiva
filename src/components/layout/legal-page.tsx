import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { formatLegalDate, legalConfig } from "@/lib/legal/config";

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Logo />
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">
          Back
        </Link>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">
          Effective {formatLegalDate(legalConfig.effectiveDate)} · Last updated{" "}
          {formatLegalDate(legalConfig.lastUpdated)}
        </p>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">{children}</div>
      </main>
    </div>
  );
}
