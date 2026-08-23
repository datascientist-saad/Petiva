import { Suspense } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sign in…" />}>
      <LoginForm />
    </Suspense>
  );
}
