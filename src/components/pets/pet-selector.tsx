"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { PetAvatar } from "@/components/pets/pet-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelectedPet } from "@/hooks/use-selected-pet";
import { cn } from "@/lib/utils";

interface PetSelectorProps {
  className?: string;
}

export function PetSelector({ className }: PetSelectorProps) {
  const { pets, selectedPet, setSelectedPetId, loading } = useSelectedPet();

  if (loading) {
    return (
      <div className={cn("h-11 w-44 animate-pulse rounded-2xl bg-muted", className)} aria-hidden />
    );
  }

  if (!selectedPet) {
    return (
      <Button asChild variant="secondary" className={cn("rounded-2xl", className)}>
        <Link href="/onboarding?new=1">
          <Plus className="size-4" />
          Add your first pet
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className={cn("h-auto min-w-[11rem] justify-between gap-2 rounded-2xl px-3 py-2", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <PetAvatar
              name={selectedPet.name}
              species={selectedPet.species}
              imageUrl={selectedPet.profile_image_url}
              size="sm"
            />
            <span className="truncate text-left">
              <span className="block truncate text-sm font-semibold">{selectedPet.name}</span>
              <span className="block text-xs text-muted-foreground capitalize">
                {selectedPet.species}
              </span>
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-2xl">
        <DropdownMenuLabel>Your pets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pets.map((pet) => (
          <DropdownMenuItem
            key={pet.id}
            onClick={() => setSelectedPetId(pet.id)}
            className="gap-2 rounded-xl"
          >
            <PetAvatar
              name={pet.name}
              species={pet.species}
              imageUrl={pet.profile_image_url}
              size="sm"
            />
            <span className="flex-1 truncate">{pet.name}</span>
            {pet.id === selectedPet.id ? (
              <span className="text-xs font-medium text-primary">Active</span>
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl">
          <Link href="/onboarding?new=1" className="gap-2">
            <Plus className="size-4" />
            Add another pet
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
