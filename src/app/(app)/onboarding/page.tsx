"use client";

import { PreSignupWizard } from "@/components/onboarding/pre-signup-wizard";
import { usePet } from "@/contexts/pet-context";

export default function OnboardingPage() {
  const { refreshPets, setSelectedPetId } = usePet();

  return (
    <PreSignupWizard
      mode="authenticated"
      onPetSaved={async (petId) => {
        setSelectedPetId(petId);
        await refreshPets();
      }}
    />
  );
}
