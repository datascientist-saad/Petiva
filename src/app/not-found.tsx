import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Page not found",
  description: `This page is not available on ${brand.name}.`,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 pb-16 text-center">
        <p className="text-sm font-medium text-primary">{brand.name}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          That link doesn&apos;t lead anywhere. Head home or open your dashboard if you already have an
          account.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="min-h-12 rounded-full">
            <Link href="/">Go to homepage</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-12 rounded-full">
            <Link href="/home">Open dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
