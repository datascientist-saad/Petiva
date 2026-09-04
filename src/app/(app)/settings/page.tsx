"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { useUser } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { inviteSchema } from "@/lib/validations";
import type { NotificationPreferences } from "@/types/database";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading, refreshProfile } = useUser();
  const { pets } = usePet();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePetId, setInvitePetId] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setPrefs(profile.notification_preferences);
    if (pets.length) setInvitePetId((prev) => prev || pets[0].id);
  }, [profile, pets]);

  async function savePrefs() {
    if (!profile || !prefs) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: prefs })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Notification preferences saved.");
      void refreshProfile();
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function sendInvite() {
    const parsed = inviteSchema.safeParse({ email: inviteEmail, role: "caregiver" });
    if (!parsed.success || !invitePetId) {
      toast.error("Enter a valid email and select a pet.");
      return;
    }
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, petId: invitePetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Invite sent! Share the link with your caregiver.");
      if (data.inviteUrl) {
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
          toast.message("Invite link copied to clipboard.");
        } catch {
          // ignore clipboard failures
        }
      }
      setInviteEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send invite.");
    }
  }

  async function deleteAccount() {
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not delete account.");
      }
      toast.success("Account deleted. We're sorry to see you go.");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (loading || !prefs) return <LoadingState />;

  const prefItems: { key: keyof NotificationPreferences; label: string }[] = [
    { key: "care_reminders", label: "Care reminders" },
    { key: "vaccination_alerts", label: "Vaccination alerts" },
    { key: "medication_alerts", label: "Medication alerts" },
    { key: "weight_suggestions", label: "Weight check suggestions" },
    { key: "email_digest", label: "Weekly email digest" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{profile?.email}</p>
          <SignOutButton fullWidth className="sm:w-auto" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefItems.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key}>{label}</Label>
              <Switch
                id={key}
                checked={prefs[key]}
                onCheckedChange={(checked) => setPrefs({ ...prefs, [key]: checked })}
              />
            </div>
          ))}
          <Button onClick={savePrefs} disabled={saving} className="rounded-xl">
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </CardContent>
      </Card>

      {pets.some((p) => p.role === "owner") && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Invite a caregiver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pets.filter((p) => p.role === "owner").length > 1 ? (
              <div className="space-y-2">
                <Label>Pet</Label>
                <Select value={invitePetId} onValueChange={setInvitePetId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets
                      .filter((p) => p.role === "owner")
                      .map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="caregiver@email.com"
                className="rounded-xl"
              />
            </div>
            <Button onClick={sendInvite} className="rounded-xl">
              Send invite
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Permanently delete your account and all pet data. This cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="rounded-xl">
            Delete account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              All your pets, records, and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAccount}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              Yes, delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
