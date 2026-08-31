"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import {
  loadOnboardingDraft,
  markOnboardingTransferred,
  wasOnboardingTransferred,
} from "@/lib/onboarding-draft";
import { transferOnboardingDraft } from "@/lib/onboarding-transfer";

export default function SetupCompletePage() {
  const router = useRouter();
  const { refreshPets } = usePet();
  const [message, setMessage] = useState("Saving your pet's plan…");

  useEffect(() => {
    async function run() {
      if (wasOnboardingTransferred()) {
        await refreshPets();
        router.replace("/home");
        router.refresh();
        return;
      }

      const draft = loadOnboardingDraft();
      if (!draft || !draft.name.trim()) {
        router.replace("/onboarding");
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login?next=/setup/complete");
          return;
        }

        const { petId, petName } = await transferOnboardingDraft(supabase, user, draft);
        markOnboardingTransferred();
        localStorage.setItem("animivo_selected_pet", petId);
        await refreshPets();
        toast.success(`${petName} is ready! 🎉`);
        router.replace("/home");
        router.refresh();
      } catch (err) {
        setMessage(toUserMessage(err, "Something went wrong while saving your pet."));
        toast.error(toUserMessage(err));
        setTimeout(() => router.replace("/home"), 3500);
      }
    }

    void run();
  }, [refreshPets, router]);

  return <LoadingState message={message} />;
}
