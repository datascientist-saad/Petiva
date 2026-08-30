import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarketingShellProps {
  children: React.ReactNode;
  variant?: "default" | "onboarding";
}

export function MarketingShell({ children, variant = "default" }: MarketingShellProps) {
  const isOnboarding = variant === "onboarding";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between px-4 md:px-8",
          isOnboarding
            ? "sticky top-0 z-40 border-b border-border/60 bg-background/95 py-3 backdrop-blur-sm"
            : "py-5",
        )}
      >
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size={isOnboarding ? "sm" : "default"} className="rounded-full">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>
      <main className={cn("flex-1", isOnboarding && "pb-4")}>{children}</main>
      <footer
        className={cn(
          "border-t border-border px-4 md:px-8",
          isOnboarding ? "py-6 text-center text-xs text-muted-foreground" : "py-10",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-6xl text-sm text-muted-foreground",
            isOnboarding ? "" : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          {!isOnboarding ? <Logo /> : null}
          <p className={cn(isOnboarding && "mx-auto")}>
            © {new Date().getFullYear()} {brand.name}. Made with care for pets and their people.
          </p>
        </div>
      </footer>
    </div>
  );
}
