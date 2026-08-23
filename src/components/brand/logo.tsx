import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex flex-col gap-0.5 transition-opacity hover:opacity-80", className)}
    >
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        {brand.logoText}
      </span>
      {showTagline ? (
        <span className="text-xs text-muted-foreground">{brand.tagline}</span>
      ) : null}
    </Link>
  );
}
