"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { hasOnboardingDraft } from "@/lib/onboarding-draft";
import { resolvePostAuthPath, sanitizeNextPath } from "@/lib/auth-redirect";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validations";

function friendlyAuthError(message: string): string {
  if (/already registered|already exists|user already/i.test(message)) {
    return "An account with this email already exists. Try signing in.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (/password/i.test(message) && /weak|short|least/i.test(message)) {
    return "Please choose a stronger password with at least 8 characters.";
  }
  return message;
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchNext = sanitizeNextPath(searchParams.get("next"));
  const [next, setNext] = useState(searchNext);

  useEffect(() => {
    trackEvent(AnalyticsEvents.SIGNUP_STARTED, { source: "signup_page" });
    if (!searchParams.get("next") && hasOnboardingDraft()) {
      setNext("/setup/complete");
    }
  }, [searchParams]);

  const loginHref = `/login?next=${encodeURIComponent(next)}`;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");

    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.fullName },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) throw error;

      trackEvent(AnalyticsEvents.SIGNUP_COMPLETED, { method: "email" });

      if (data.session) {
        toast.success(`Welcome to ${brand.name}!`);
        router.replace(
          hasOnboardingDraft()
            ? "/setup/complete"
            : resolvePostAuthPath(next, {
                hasNoPets: true,
                hasIncompleteOnboarding: true,
                hasPendingOnboardingDraft: hasOnboardingDraft(),
              })
        );
        router.refresh();
        return;
      }

      toast.success("Check your email to confirm your account.");
      router.replace(`/verify-email?email=${encodeURIComponent(parsed.data.email)}&next=${encodeURIComponent(next)}`);
    } catch (err) {
      const message = friendlyAuthError(err instanceof Error ? err.message : "Could not create account.");
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-border shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Create your account</CardTitle>
        <CardDescription>Start caring for your pets with {brand.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton nextPath={next} label="Sign up with Google" />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or email</span>
          <Separator className="flex-1" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="min-h-11 rounded-xl"
              placeholder="Alex Johnson"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName ? (
              <p id="fullName-error" className="text-sm text-destructive" role="alert">
                {errors.fullName}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-xl"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            error={errors.password}
            showRequirements
          />
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="min-h-11 w-full rounded-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account, you agree to Animivo’s{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/ai-disclaimer" className="font-medium text-primary hover:underline">
              AI Disclaimer
            </Link>
            .
          </p>
        </form>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
