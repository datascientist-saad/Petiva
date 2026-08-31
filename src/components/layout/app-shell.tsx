"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  FileText,
  HeartPulse,
  ListChecks,
  MoreHorizontal,
  Salad,
  Settings,
  UserRound,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { brand } from "@/lib/brand";
import { t, DEFAULT_LOCALE } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/home", labelKey: "nav.today" as const, icon: CalendarDays },
  { href: "/health/diet", labelKey: "nav.nutrition" as const, icon: Salad },
  { href: "/health", labelKey: "nav.health" as const, icon: HeartPulse },
  { href: "/care-plan", labelKey: "nav.carePlan" as const, icon: ListChecks },
] as const;

const moreNav = [
  { href: "/health/timeline", labelKey: "nav.records" as const, icon: FileText },
  { href: "/ai", labelKey: "nav.ai" as const, icon: Bot },
  { href: "/profile", labelKey: "nav.profile" as const, icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface AppShellProps {
  children: React.ReactNode;
  petSelector?: React.ReactNode;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        compact && "flex-col gap-1 px-2 py-2 text-[11px]"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children, petSelector }: AppShellProps) {
  const pathname = usePathname();
  const locale = DEFAULT_LOCALE;

  const isActive = (href: string) =>
    pathname === href || (href !== "/home" && pathname.startsWith(href));

  const moreActive = moreNav.some((item) => isActive(item.href));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/50 p-5 md:flex">
          <Logo className="mb-2" showTagline />
          {petSelector ? <div className="mb-6 mt-4">{petSelector}</div> : null}
          <nav className="flex flex-1 flex-col gap-1">
            {primaryNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(locale, item.labelKey)}
                icon={item.icon}
                active={isActive(item.href)}
              />
            ))}
            <div className="my-2 border-t border-border pt-2">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t(locale, "nav.more")}
              </p>
            </div>
            {moreNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={"labelKey" in item ? t(locale, item.labelKey) : item.label}
                icon={item.icon}
                active={isActive(item.href)}
              />
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-border pt-4">
            <SignOutButton variant="ghost" fullWidth className="justify-start" />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              {petSelector}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 py-2 backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={t(locale, item.labelKey)}
                  icon={item.icon}
                  active={isActive(item.href)}
                  compact
                />
              ))}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex h-auto flex-col gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                      moreActive ? "bg-primary/12 text-primary" : "text-muted-foreground"
                    )}
                  >
                    <MoreHorizontal className="size-5" />
                    <span>{t(locale, "nav.more")}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl">
                  <SheetHeader>
                    <SheetTitle>{brand.name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 grid gap-2">
                    {moreNav.map((item) => (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        label={"labelKey" in item ? t(locale, item.labelKey) : item.label}
                        icon={item.icon}
                        active={isActive(item.href)}
                      />
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
