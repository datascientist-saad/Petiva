"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const next = sanitizeNextPath(searchParams.get("next"));
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("Enter your email on the sign-up page to request a new confirmation.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend confirmation.";
      toast.error(/rate limit|too many/i.test(message) ? "Please wait a minute before requesting another email." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-border shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Confirm your email</CardTitle>
        <CardDescription>We sent a confirmation link to finish creating your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
        {email ? (
          <p>
            Check <span className="font-medium text-foreground">{email}</span> and open the link to
            continue.
          </p>
        ) : (
          <p>Check your inbox and open the confirmation link to continue.</p>
        )}
        <Button onClick={() => void resend()} disabled={loading} className="min-h-11 w-full rounded-full">
          {loading ? "Sending…" : "Resend confirmation email"}
        </Button>
        <Button asChild variant="outline" className="min-h-11 w-full rounded-full">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
