export const dynamic = "force-dynamic";

import { AppProviders } from "./app-providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
