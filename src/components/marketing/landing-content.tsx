import {
  Bot,
  HeartPulse,
  PawPrint,
  Salad,
  Scale,
  ShieldCheck,
  Syringe,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { LandingCta } from "@/components/marketing/landing-cta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const howItWorks = [
  {
    step: "1",
    title: "Tell us about your pet",
    body: "Share species, weight, lifestyle, and what you already feed. It takes a few minutes.",
  },
  {
    step: "2",
    title: "Receive a personalized starting plan",
    body: "Dogs and cats get an estimated calorie range. Birds get tracking and care-organization tools.",
  },
  {
    step: "3",
    title: "Track care and refine it over time",
    body: "Log meals, weight, vaccinations, and medications, then adjust with your veterinarian.",
  },
] as const;

const productPreviews = [
  {
    title: "Pet dashboard",
    description: "Today’s tasks, weight, and a calm snapshot of what needs attention.",
    icon: HeartPulse,
    mock: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-sm font-medium">Good morning, Luna</p>
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
      </div>
    ),
  },
  {
    title: "Diet-plan summary",
    description: "A daily calorie estimate, meal split, and the assumptions behind it.",
    icon: Salad,
    mock: (
      <div className="space-y-3">
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Daily estimate</p>
          <p className="font-display text-xl font-semibold">650–794 kcal</p>
        </div>
        <p className="text-xs text-muted-foreground">08:00 — 361 kcal · 18:00 — 361 kcal</p>
      </div>
    ),
  },
  {
    title: "Vaccinations and medications",
    description: "Due dates, clinic notes, and active medication reminders in one place.",
    icon: Syringe,
    mock: (
      <div className="space-y-2 text-sm">
        <p>Rabies booster · due in 12 days</p>
        <p className="text-muted-foreground">Daily joint supplement · morning</p>
      </div>
    ),
  },
  {
    title: "Meals and weight tracking",
    description: "Log what was eaten and watch weight trends over time.",
    icon: Scale,
    mock: (
      <div className="space-y-2 text-sm">
        <p>Breakfast logged · 180 kcal</p>
        <p className="text-muted-foreground">Weight trend: steady this month</p>
      </div>
    ),
  },
  {
    title: "AI care guidance",
    description: "Ask questions grounded in the records you choose to keep. AI does not diagnose.",
    icon: Bot,
    mock: (
      <div className="rounded-2xl bg-primary/10 p-4">
        <p className="text-sm font-medium text-primary">{brand.aiName}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          I can explain Luna’s logged meals. This is general information, not a diagnosis.
        </p>
      </div>
    ),
  },
] as const;

const faqs = [
  {
    q: "Is Animivo a replacement for a veterinarian?",
    a: "No. Animivo helps you organize care and provides starting-point estimates. Medical decisions belong with a licensed veterinarian.",
  },
  {
    q: "How are diet estimates calculated?",
    a: "For dogs and cats we start from resting energy requirement (70 × weightKg^0.75) and apply one documented maintenance factor. Results are estimates. Birds do not receive a calorie calculation yet.",
  },
  {
    q: "Which pets are supported?",
    a: "Dogs, cats, and birds can have profiles and care tracking. Personalized calorie estimates are currently available for dogs and cats only.",
  },
  {
    q: "Is Animivo free?",
    a: "You can create a pet plan and use core tracking without a credit card. Some future Plus features may be optional.",
  },
  {
    q: "How is pet information protected?",
    a: "Your records are stored with authentication and row-level security. We do not sell personal data. See the Privacy Policy for details.",
  },
  {
    q: "Can I delete my account and pet data?",
    a: "Yes. Settings includes account deletion, which removes your pets, uploaded files, and related records.",
  },
  {
    q: "What should I do in an emergency?",
    a: "Contact a veterinarian or emergency clinic immediately. Animivo is not an emergency service and cannot treat animals.",
  },
] as const;

export function LandingContent() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              <PawPrint className="size-4 text-primary" aria-hidden />
              Personalized starting plans for dogs, cats, and birds
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {brand.tagline}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{brand.subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LandingCta href="/get-started">Create my pet&apos;s plan</LandingCta>
              <LandingCta href="/login" variant="outline">
                Sign in
              </LandingCta>
            </div>
            <p className="text-sm text-muted-foreground">Free to start · No credit card required</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-gentle-scale lg:max-w-md">
            <div className="absolute -left-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl" aria-hidden />
            <div className="absolute -bottom-8 -right-4 size-32 rounded-full bg-accent/15 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">{brand.logoText}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Today
                </span>
              </div>
              {productPreviews[0].mock}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40 px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">How Animivo works</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {howItWorks.map((item) => (
              <Card key={item.step} className="rounded-2xl">
                <CardHeader>
                  <p className="text-sm font-medium text-primary">Step {item.step}</p>
                  <CardTitle className="font-display text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Product preview</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          These previews reflect features that already exist in Animivo. Nothing here is a promised future product.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {productPreviews.map((preview) => (
            <Card key={preview.title} className="rounded-2xl">
              <CardHeader>
                <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <preview.icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="font-display text-lg">{preview.title}</CardTitle>
                <CardDescription>{preview.description}</CardDescription>
              </CardHeader>
              <CardContent>{preview.mock}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40 px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl space-y-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Supported pets</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-lg">Dogs</CardTitle>
                <CardDescription>
                  Profiles, estimated calorie starting points, meal and weight tracking, vaccinations, and medications.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-lg">Cats</CardTitle>
                <CardDescription>
                  The same care tools, with cat-specific energy factors. Estimates remain starting points.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-lg">Birds</CardTitle>
                <CardDescription>
                  Species profile, gram-based weight tracking, and care organization. Personalized calorie or
                  feeding-quantity calculation is not available yet — ask an avian veterinarian.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Safety and trust</h2>
            <p className="mt-3 text-muted-foreground">
              Animivo is a care-organization product. It does not replace a licensed veterinarian.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "Calculations are estimates and starting points.",
              "Medical decisions belong with veterinarians.",
              "User data is private and not sold.",
              "You remain in control of your records and can delete them.",
            ].map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl border bg-card p-4 text-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-border bg-card/40 px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
          <dl className="mt-8 space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-medium">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to create a starting plan?
          </h2>
          <p className="text-muted-foreground">
            Tell us about your pet, preview an estimate, then save the full plan with a free account.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LandingCta href="/get-started">Create my pet&apos;s plan</LandingCta>
            <LandingCta href="/login" variant="outline">
              Sign in
            </LandingCta>
          </div>
        </div>
      </section>
    </>
  );
}
