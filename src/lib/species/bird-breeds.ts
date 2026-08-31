export const BIRD_SPECIES_OPTIONS = [
  "Budgie",
  "Cockatiel",
  "Lovebird",
  "Conure",
  "African grey",
  "Amazon parrot",
  "Macaw",
  "Canary",
  "Finch",
  "Other companion bird",
] as const;

export type BirdSpeciesOption = (typeof BIRD_SPECIES_OPTIONS)[number];

export const BIRD_WING_STATUS = ["flighted", "clipped", "unknown"] as const;
export const BIRD_HOUSING = ["indoor_cage", "aviary", "mixed"] as const;
export const BIRD_SOCIAL = ["alone", "with_other_birds", "mixed"] as const;
