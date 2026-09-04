import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { publicPageMetadata } from "@/lib/seo";
import SignupForm from "./signup-form";

export const metadata: Metadata = publicPageMetadata({
  title: "Create an account",
  description: "Create a free Animivo account to save your pet’s care plan.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sign up…" />}>
      <SignupForm />
    </Suspense>
  );
}
