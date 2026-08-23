import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  variant?: "spinner" | "skeleton";
  className?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

export function LoadingState({
  label = "Loading…",
  variant = "spinner",
  className,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 animate-gentle-scale", className)} aria-busy aria-label={label}>
        <SkeletonBlock className="h-8 w-2/5" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-16 w-3/5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground animate-gentle-scale",
        className
      )}
      aria-busy
      aria-label={label}
    >
      <Loader2 className="size-8 animate-spin-slow text-primary" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
