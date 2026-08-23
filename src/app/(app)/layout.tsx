"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PetSelector } from "@/components/pets/pet-selector";
import { PetProvider, usePet } from "@/contexts/pet-context";
import { UserProvider } from "@/contexts/user-context";
import { LoadingState } from "@/components/shared/page-states";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { pets, loading } = usePet();

  useEffect(() => {
    if (loading) return;
    const onOnboarding = pathname.startsWith("/onboarding");
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

  return (
    <AppShell petSelector={<PetSelector />}>{children}</AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PetProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </PetProvider>
    </UserProvider>
  );
}
