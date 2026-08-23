import Link from "next/link";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-4xl font-bold text-primary">{brand.logoText}</h1>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">{brand.tagline}</p>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">{brand.subtitle}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg" className="rounded-xl">
          <Link href="/signup">Get started free</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-xl">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
