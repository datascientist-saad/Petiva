"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import {
  acquireTransferLock,
  loadOnboardingDraft,
  markOnboardingTransferred,
  releaseTransferLock,
  wasOnboardingTransferred,
} from "@/lib/onboarding-draft";
import { transferOnboardingDraft } from "@/lib/onboarding-transfer";
import { AnalyticsService } from "@/services/notification-service";

export default function SetupCompletePage() {
  const router = useRouter();
  const { refreshPets } = usePet();
  const [message, setMessage] = useState("Saving your pet's plan…");
  const [error, setError] = useState<string | null>(null);

  async function persistDraft() {
    if (wasOnboardingTransferred()) {
      await refreshPets();
      router.replace("/home");
      router.refresh();
      return;
    }

    const draft = loadOnboardingDraft();
    if (!draft || !draft.name.trim()) {
      router.replace("/get-started");
      return;
    }

    if (!acquireTransferLock()) {
      setMessage("Your pet is already being saved…");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        releaseTransferLock();
        router.replace("/login?next=/setup/complete");
        return;
      }

      setMessage("Saving your pet's plan…");
      const { petId, petName } = await transferOnboardingDraft(supabase, user, draft);
      const analytics = new AnalyticsService(supabase);
      await analytics.track(AnalyticsEvents.PET_SAVED, user.id, petId, {
        species: draft.species,
        source: "setup_complete",
      });
      markOnboardingTransferred();
      localStorage.setItem("animivo_selected_pet", petId);
      await refreshPets();
      setMessage(`${petName} is ready.`);
      toast.success(`${petName} is ready!`);
      router.replace("/home");
      router.refresh();
    } catch (err) {
      releaseTransferLock();
      const text = toUserMessage(err, "Something went wrong while saving your pet.");
      setError(text);
      setMessage(text);
      toast.error(text);
    }
  }

  useEffect(() => {
    void persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after auth landing
  }, []);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-semibold">We couldn&apos;t save the plan</h1>
        <p className="text-sm text-muted-foreground" role="alert">
          {error} Your answers are still saved on this device.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="min-h-11 rounded-full" onClick={() => { setError(null); void persistDraft(); }}>
            Try again
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-full">
            <Link href="/get-started">Review answers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <LoadingState message={message} />;
}
