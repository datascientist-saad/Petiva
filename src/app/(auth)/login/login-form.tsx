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
import { resolvePostAuthPath, sanitizeNextPath } from "@/lib/auth-redirect";
import { brand } from "@/lib/brand";
import { hasOnboardingDraft } from "@/lib/onboarding-draft";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { PetService } from "@/services/pet-service";

function friendlyLoginError(message: string): string {
  if (/invalid login|invalid credentials|invalid email or password/i.test(message)) {
    return "That email or password didn’t match. Try again or reset your password.";
  }
  if (/email not confirmed|not confirmed/i.test(message)) {
    return "Please confirm your email before signing in. You can request a new confirmation email.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return message;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchNext = sanitizeNextPath(searchParams.get("next"));
  const [next, setNext] = useState(searchNext);

  useEffect(() => {
    if (!searchParams.get("next") && hasOnboardingDraft()) {
      setNext("/setup/complete");
    }
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;

      toast.success("Welcome back!");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const pets = await new PetService(supabase).listForUser(user.id);
        const destination = resolvePostAuthPath(next, {
          hasNoPets: pets.length === 0,
          hasIncompleteOnboarding: pets.some((pet) => !pet.onboarding_completed),
          hasPendingOnboardingDraft: hasOnboardingDraft(),
        });
        router.replace(destination);
        router.refresh();
        return;
      }

      router.replace(next);
      router.refresh();
    } catch (err) {
      const message = friendlyLoginError(err instanceof Error ? err.message : "Could not sign in.");
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-border shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Sign in</CardTitle>
        <CardDescription>Welcome back to {brand.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton nextPath={next} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or email</span>
          <Separator className="flex-1" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="sr-only">Password options</span>
              <Link href="/forgot-password" className="ml-auto text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              error={errors.password}
            />
          </div>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="min-h-11 w-full rounded-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          New to {brand.name}?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
