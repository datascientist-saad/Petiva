import Image from "next/image";
import type { Species } from "@/types/database";
import { speciesEmoji } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const speciesColors: Partial<Record<Species, string>> = {
  cat: "bg-[#E8D5C4] text-[#5C4A3A]",
  dog: "bg-[#D4E4D8] text-[#3D5C47]",
  bird: "bg-[#E4E8D4] text-[#4A5C3D]",
};

interface PetAvatarProps {
  name: string;
  species: Species;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-sm",
  md: "size-11 text-lg",
  lg: "size-16 text-2xl",
};

export function PetAvatar({
  name,
  species,
  imageUrl,
  size = "md",
  className,
}: PetAvatarProps) {
  const dimension = size === "sm" ? 32 : size === "md" ? 44 : 64;
  const colorClass = speciesColors[species] ?? "bg-secondary text-foreground";

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-2 ring-background",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={`${name}'s photo`}
          width={dimension}
          height={dimension}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-medium ring-2 ring-background",
        colorClass,
        sizeClasses[size],
        className
      )}
      aria-label={`${name}, ${species}`}
    >
      <span aria-hidden>{speciesEmoji(species)}</span>
    </div>
  );
}
