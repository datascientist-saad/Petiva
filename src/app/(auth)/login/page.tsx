import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { publicPageMetadata } from "@/lib/seo";
import LoginForm from "./login-form";

export const metadata: Metadata = publicPageMetadata({
  title: "Sign in",
  description: "Sign in to Animivo to view your pets, plans, and care records.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sign in…" />}>
      <LoginForm />
    </Suspense>
  );
}
