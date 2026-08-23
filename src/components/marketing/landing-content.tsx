import Link from "next/link";
import {
  Activity,
  Bell,
  Bot,
  HeartPulse,
  PawPrint,
  Salad,
  Syringe,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Health Timeline",
    description: "See vet visits, symptoms, and milestones in one calm, chronological view.",
    icon: HeartPulse,
  },
  {
    title: "Smart Care Reminders",
    description: "Never miss grooming, meds, or daily routines with gentle nudges.",
    icon: Bell,
  },
  {
    title: "Nutrition Tracking",
    description: "Log meals and portions to keep feeding habits balanced and consistent.",
    icon: Salad,
  },
  {
    title: "AI Pet Assistant",
    description: "Ask Pawly AI questions grounded in your pet’s real health profile.",
    icon: Bot,
  },
  {
    title: "Vaccination Tracking",
    description: "Stay ahead of boosters with clear due dates and clinic notes.",
    icon: Syringe,
  },
  {
    title: "Multiple Pets",
    description: "Switch between companions effortlessly — each with their own profile.",
    icon: PawPrint,
  },
] as const;

export function LandingContent() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              <Activity className="size-4 text-primary" />
              Pet wellness, simplified
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {brand.tagline}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{brand.subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-gentle-scale lg:max-w-md">
            <div className="absolute -left-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-8 -right-4 size-32 rounded-full bg-accent/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">{brand.logoText}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Today
                </span>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm font-medium">Good morning, Luna 🐱</p>
                  <p className="mt-1 text-xs text-muted-foreground">2 care tasks due today</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="mt-1 font-display text-xl font-semibold">4.2 kg</p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Next vaccine</p>
                    <p className="mt-1 font-display text-xl font-semibold">Mar 12</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-primary/10 p-4">
                  <p className="text-sm font-medium text-primary">Pawly AI</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    &ldquo;Luna&apos;s meal log looks balanced this week. Consider a hydration check-in.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40 px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need to care with confidence
            </h2>
            <p className="mt-3 text-muted-foreground">
              Warm, thoughtful tools designed for real pet parents — not cluttered dashboards.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="rounded-2xl border-border/80 bg-card shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="font-display text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to give {brand.name} a try?
          </h2>
          <p className="text-muted-foreground">
            Create your free account and set up your first pet in minutes.
          </p>
          <Button asChild size="lg" className="rounded-full px-10">
            <Link href="/signup">Get Started — it&apos;s free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
