import { Suspense } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sign up…" />}>
      <SignupForm />
    </Suspense>
  );
}
