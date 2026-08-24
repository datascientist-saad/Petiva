"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  HeartPulse,
  Home,
  ListChecks,
  Settings,
  UserRound,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/care", label: "Care", icon: ListChecks },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/profile", label: "Profile", icon: UserRound },
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
      <Icon className={cn("shrink-0", compact ? "size-5" : "size-5")} />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children, petSelector }: AppShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/home" && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/50 p-5 md:flex">
          <Logo className="mb-8" />
          {petSelector ? <div className="mb-6">{petSelector}</div> : null}
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-border pt-4">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive("/settings")
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Settings className="size-5" />
              Settings
            </Link>
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
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} compact />
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
