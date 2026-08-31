"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  variant = "outline",
  fullWidth = false,
}: {
  className?: string;
  variant?: "outline" | "ghost" | "secondary" | "destructive";
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      try {
        localStorage.removeItem("animivo_selected_pet");
        localStorage.removeItem("animivo_selected_pet");
      } catch {
        // ignore
      }
      toast.success("Signed out. See you soon!");
      router.replace("/login");
      router.refresh();
    } catch (err) {
      toast.error(toUserMessage(err, "Could not sign out. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleSignOut}
      disabled={loading}
      className={cn("rounded-xl", fullWidth && "w-full", className)}
    >
      <LogOut className="size-4" />
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
