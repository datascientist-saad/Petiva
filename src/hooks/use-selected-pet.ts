"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PetService } from "@/services/pet-service";
import type { PetWithDetails } from "@/types/database";

const STORAGE_KEY = "pawly_selected_pet";

export function useSelectedPet() {
  const [pets, setPets] = useState<PetWithDetails[]>([]);
  const [selectedPetId, setSelectedPetIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPets([]);
        setSelectedPetIdState(null);
        return;
      }

      const service = new PetService(supabase);
      const list = await service.listForUser(user.id);
      setPets(list);

      const storedId =
        typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const validStored = list.find((pet) => pet.id === storedId);
      const nextId = validStored?.id ?? list[0]?.id ?? null;

      setSelectedPetIdState(nextId);
      if (nextId && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSelectedPetId = useCallback((id: string) => {
    setSelectedPetIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null;

  return {
    pets,
    selectedPet,
    selectedPetId,
    setSelectedPetId,
    loading,
    error,
    refresh,
  };
}
