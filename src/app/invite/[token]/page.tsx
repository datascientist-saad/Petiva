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

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setAuthenticated(!!user);

      const { data } = await supabase
        .from("pet_access")
        .select("pets(name)")
        .eq("invite_token", token)
        .maybeSingle();

      if (data?.pets) {
        const pets = data.pets as unknown as { name: string } | { name: string }[];
        const name = Array.isArray(pets) ? pets[0]?.name : pets.name;
        if (name) setPetName(name);
      }
      setLoading(false);
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
          {petName ? (
            <p>
              You've been invited to help care for <strong>{petName}</strong>.
            </p>
          ) : (
            <p>This invite link doesn't look valid. It may have already been used.</p>
          )}

          {authenticated && petName ? (
            <Button onClick={acceptInvite} disabled={accepting} className="w-full rounded-xl">
              {accepting ? "Accepting…" : `Join ${petName}'s care team`}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sign in or create an account to accept.</p>
              <Button asChild className="w-full rounded-xl">
                <Link href={`/login?next=/invite/${token}`}>Sign in</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
