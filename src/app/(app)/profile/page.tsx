"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PetAvatar } from "@/components/pets/pet-avatar";
import { EmptyState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { useUser } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { profileUpdateSchema } from "@/lib/validations";

export default function ProfilePage() {
  const { profile, loading: userLoading, refreshProfile } = useUser();
  const { pets, loading: petsLoading } = usePet();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const parsed = profileUpdateSchema.safeParse({
      full_name: fullName,
      timezone: profile.timezone,
      notification_preferences: profile.notification_preferences,
    });
    if (!parsed.success) {
      toast.error("Please enter a valid name.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile updated!");
      void refreshProfile();
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || petsLoading) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account & pets</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled className="rounded-xl" />
            </div>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Your pets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pets.length === 0 ? (
            <EmptyState title="No pets yet" description="Add your first pet to get started." />
          ) : (
            pets.map((pet) => (
              <Link key={pet.id} href={`/pets/${pet.id}`}>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3 transition-colors hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <PetAvatar
                      name={pet.name}
                      species={pet.species}
                      imageUrl={pet.profile_image_url}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pet.species}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
          <Button asChild variant="secondary" className="mt-2 w-full rounded-xl">
            <Link href="/onboarding?new=1">Add another pet</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Signed in as {profile?.email}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/settings">Open settings</Link>
            </Button>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
