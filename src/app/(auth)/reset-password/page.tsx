"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    let subscription: { unsubscribe: () => void } | undefined;
    let settled = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settled = true;
        setReady(true);
        return;
      }

      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession) {
          settled = true;
          setReady(true);
        }
      });

      subscription = authSubscription;
    });

    const timeout = window.setTimeout(() => {
      if (!settled) setExpired(true);
    }, 8000);

    return () => {
      subscription?.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
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
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;

      toast.success("Password updated successfully.");
      router.replace("/home");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update password.";
      toast.error(/expired|invalid/i.test(message) ? "This reset link has expired. Request a new one." : message);
      if (/expired|invalid/i.test(message)) setExpired(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-border shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your {brand.name} account</CardDescription>
      </CardHeader>
      <CardContent>
        {expired && !ready ? (
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>This reset link is invalid or has expired.</p>
            <Button asChild className="min-h-11 rounded-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : !ready ? (
          <p className="text-center text-sm text-muted-foreground">
            Verifying your reset link… If this takes too long,{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              request a new link
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              id="password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={errors.password}
              showRequirements
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
            <Button type="submit" className="min-h-11 w-full rounded-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
