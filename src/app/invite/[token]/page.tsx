"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/page-states";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [petName, setPetName] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthenticated(!!user);

      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setInvalid(true);
        } else {
          setPetName(data.petName ?? null);
          setInvitedEmail(data.invitedEmail ?? null);
        }
      } catch {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    }
    void check();
  }, [token]);

  async function acceptInvite() {
    setAccepting(true);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`You're now a caregiver for ${data.petName}!`);
      router.replace("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept invite.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) return <LoadingState message="Checking invite…" />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-primary">{brand.logoText}</CardTitle>
          <p className="text-sm text-muted-foreground">Caregiver invite</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {petName && !invalid ? (
            <>
              <p>
                You&apos;ve been invited to help care for <strong>{petName}</strong>.
              </p>
              {invitedEmail ? (
                <p className="text-sm text-muted-foreground">
                  This invite was sent to <strong>{invitedEmail}</strong>.
                </p>
              ) : null}
            </>
          ) : (
            <p>This invite link doesn&apos;t look valid. It may have already been used.</p>
          )}

          {authenticated && petName && !invalid ? (
            <Button onClick={acceptInvite} disabled={accepting} className="w-full rounded-xl">
              {accepting ? "Accepting…" : `Join ${petName}'s care team`}
            </Button>
          ) : petName && !invalid ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sign in or create an account to accept.</p>
              <Button asChild className="w-full rounded-xl">
                <Link href={`/login?next=/invite/${token}`}>Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href={`/signup?next=/invite/${token}`}>Create account</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
