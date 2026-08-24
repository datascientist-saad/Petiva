"use client";

import { MissingConfigScreen, hasSupabaseConfig } from "@/components/shared/missing-config";

export function ConfigGate({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) {
    return <MissingConfigScreen />;
  }
  return <>{children}</>;
}
