export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { AppProviders } from "./app-providers";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  title: "Dashboard",
  description: "Your Animivo pet care workspace.",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
