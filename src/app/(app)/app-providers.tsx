"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PetSelector } from "@/components/pets/pet-selector";
import { MissingConfigScreen, hasSupabaseConfig } from "@/components/shared/missing-config";
import { PetProvider, usePet } from "@/contexts/pet-context";
import { UserProvider } from "@/contexts/user-context";
import { LoadingState } from "@/components/shared/page-states";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { pets, loading } = usePet();

  useEffect(() => {
    if (loading) return;
    const onOnboarding = pathname.startsWith("/onboarding") || pathname.startsWith("/setup");
    if (!pets.length && !onOnboarding) {
      router.replace("/onboarding");
    }
  }, [pets.length, loading, pathname, router]);

  if (loading && !pathname.startsWith("/onboarding")) {
    return (
      <AppShell petSelector={<PetSelector />}>
        <LoadingState message="Getting things ready for you and your pets…" />
      </AppShell>
    );
  }

  return <AppShell petSelector={<PetSelector />}>{children}</AppShell>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) {
    return <MissingConfigScreen />;
  }

  return (
    <UserProvider>
      <PetProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </PetProvider>
    </UserProvider>
  );
}
