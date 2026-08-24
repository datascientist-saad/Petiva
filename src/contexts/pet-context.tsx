"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { PetService } from "@/services/pet-service";
import type { PetWithDetails } from "@/types/database";

interface PetContextValue {
  pets: PetWithDetails[];
  selectedPet: PetWithDetails | null;
  selectedPetId: string | null;
  setSelectedPetId: (id: string) => void;
  loading: boolean;
  error: string | null;
  refreshPets: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | null>(null);

const STORAGE_KEY = "petiva_selected_pet";
const LEGACY_STORAGE_KEY = "pawly_selected_pet";

export function PetProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const petService = useMemo(() => new PetService(supabase), [supabase]);
  const [pets, setPets] = useState<PetWithDetails[]>([]);
  const [selectedPetId, setSelectedPetIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPets([]);
        setSelectedPetIdState(null);
        return;
      }
      const list = await petService.listForUser(user.id);
      setPets(list);
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
          : null;
      const validStored = list.find((p) => p.id === stored);
      const nextId = validStored?.id ?? list[0]?.id ?? null;
      setSelectedPetIdState(nextId);
      if (nextId) {
        localStorage.setItem(STORAGE_KEY, nextId);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch (err) {
      setError(toUserMessage(err, "Couldn't load your pets right now."));
    } finally {
      setLoading(false);
    }
  }, [petService, supabase.auth]);

  useEffect(() => {
    void refreshPets();
  }, [refreshPets]);

  const setSelectedPetId = useCallback((id: string) => {
    setSelectedPetIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) ?? null,
    [pets, selectedPetId]
  );

  const value = useMemo(
    () => ({
      pets,
      selectedPet,
      selectedPetId,
      setSelectedPetId,
      loading,
      error,
      refreshPets,
    }),
    [pets, selectedPet, selectedPetId, setSelectedPetId, loading, error, refreshPets]
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePet must be used within PetProvider");
  return ctx;
}

// Alias for components using the hook naming convention
export const useSelectedPet = usePet;
