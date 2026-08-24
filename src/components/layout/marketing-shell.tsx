import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>© {new Date().getFullYear()} {brand.name}. Made with care for pets and their people.</p>
        </div>
      </footer>
    </div>
  );
}
