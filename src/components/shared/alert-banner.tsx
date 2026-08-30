import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  title?: string;
  children: React.ReactNode;
  variant?: "info" | "warning" | "error";
  className?: string;
}

export function AlertBanner({ title, children, variant = "info", className }: AlertBannerProps) {
  const Icon = variant === "warning" || variant === "error" ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-sm leading-relaxed",
        variant === "info" && "border-primary/20 bg-primary/5 text-foreground",
        variant === "warning" && "border-warning/40 bg-warning/10 text-foreground",
        variant === "error" && "border-destructive/30 bg-destructive/10 text-foreground",
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          {title ? <p className="font-medium">{title}</p> : null}
          <div className="text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}
