/**
 * Central species capability registry for Animivo.
 * Do not scatter species checks across UI — use this module.
 */

export type SupportedSpeciesId = "cat" | "dog" | "bird";
export type FutureSpeciesId =
  | "rabbit"
  | "guinea_pig"
  | "hamster"
  | "reptile"
  | "fish"
  | "other";
export type SpeciesId = SupportedSpeciesId | FutureSpeciesId;

export type WeightUnitPreference = "kg" | "lb" | "g";

export interface SpeciesDefinition {
  id: SpeciesId;
  displayName: string;
  icon: string;
  illustrationKey: string;
  supported: boolean;
  defaultWeightUnit: WeightUnitPreference;
  nutritionEngine: "mammal" | "bird" | "none";
  preventiveCareEngine: "mammal" | "bird" | "none";
  symptomCategories: string[];
  features: {
    vaccinations: boolean;
    deworming: boolean;
    walks: boolean;
    habitat: boolean;
    mixedFeeding: boolean;
    bodyConditionScore: boolean;
    neuterStatus: boolean;
    dietCheckIns: boolean;
    weightBaseline: boolean;
  };
  profileFieldGroups: ("basics" | "body" | "health" | "feeding" | "habitat" | "goals")[];
}

const MAMMAL_FEATURES: SpeciesDefinition["features"] = {
  vaccinations: true,
  deworming: true,
  walks: true,
  habitat: false,
  mixedFeeding: true,
  bodyConditionScore: true,
  neuterStatus: true,
  dietCheckIns: true,
  weightBaseline: false,
};

const BIRD_FEATURES: SpeciesDefinition["features"] = {
  vaccinations: false,
  deworming: false,
  walks: false,
  habitat: true,
  mixedFeeding: false,
  bodyConditionScore: false,
  neuterStatus: false,
  dietCheckIns: true,
  weightBaseline: true,
};

export const SPECIES_REGISTRY: Record<SpeciesId, SpeciesDefinition> = {
  cat: {
    id: "cat",
    displayName: "Cat",
    icon: "🐱",
    illustrationKey: "cat",
    supported: true,
    defaultWeightUnit: "kg",
    nutritionEngine: "mammal",
    preventiveCareEngine: "mammal",
    symptomCategories: ["appetite", "digestion", "skin", "mobility", "breathing", "behavior"],
    features: MAMMAL_FEATURES,
    profileFieldGroups: ["basics", "body", "health", "feeding", "goals"],
  },
  dog: {
    id: "dog",
    displayName: "Dog",
    icon: "🐶",
    illustrationKey: "dog",
    supported: true,
    defaultWeightUnit: "kg",
    nutritionEngine: "mammal",
    preventiveCareEngine: "mammal",
    symptomCategories: ["appetite", "digestion", "skin", "mobility", "breathing", "behavior"],
    features: MAMMAL_FEATURES,
    profileFieldGroups: ["basics", "body", "health", "feeding", "goals"],
  },
  bird: {
    id: "bird",
    displayName: "Bird",
    icon: "🦜",
    illustrationKey: "bird",
    supported: true,
    defaultWeightUnit: "g",
    nutritionEngine: "bird",
    preventiveCareEngine: "bird",
    symptomCategories: [
      "droppings",
      "feathers",
      "respiratory",
      "appetite",
      "balance",
      "behavior",
      "reproduction",
    ],
    features: BIRD_FEATURES,
    profileFieldGroups: ["basics", "body", "health", "feeding", "habitat", "goals"],
  },
  rabbit: stub("rabbit", "Rabbit", "🐰"),
  guinea_pig: stub("guinea_pig", "Guinea pig", "🐹"),
  hamster: stub("hamster", "Hamster", "🐹"),
  reptile: stub("reptile", "Reptile", "🦎"),
  fish: stub("fish", "Fish", "🐠"),
  other: stub("other", "Other companion", "🐾"),
};

function stub(id: FutureSpeciesId, displayName: string, icon: string): SpeciesDefinition {
  return {
    id,
    displayName,
    icon,
    illustrationKey: id,
    supported: false,
    defaultWeightUnit: "kg",
    nutritionEngine: "none",
    preventiveCareEngine: "none",
    symptomCategories: [],
    features: {
      vaccinations: false,
      deworming: false,
      walks: false,
      habitat: false,
      mixedFeeding: false,
      bodyConditionScore: false,
      neuterStatus: false,
      dietCheckIns: false,
      weightBaseline: false,
    },
    profileFieldGroups: ["basics"],
  };
}

export const SUPPORTED_SPECIES = (Object.values(SPECIES_REGISTRY) as SpeciesDefinition[]).filter(
  (s) => s.supported
);

export function getSpeciesDefinition(species: string | null | undefined): SpeciesDefinition {
  const id = (species ?? "cat") as SpeciesId;
  return SPECIES_REGISTRY[id] ?? SPECIES_REGISTRY.cat;
}

export function isSupportedSpecies(species: string): species is SupportedSpeciesId {
  const def = SPECIES_REGISTRY[species as SpeciesId];
  return Boolean(def?.supported);
}

export function speciesUsesMammalNutrition(species: string): boolean {
  return getSpeciesDefinition(species).nutritionEngine === "mammal";
}

export function speciesUsesBirdNutrition(species: string): boolean {
  return getSpeciesDefinition(species).nutritionEngine === "bird";
}
