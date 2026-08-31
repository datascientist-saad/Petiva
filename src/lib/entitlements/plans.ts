export type SubscriptionPlan = "free" | "plus";

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  description: string;
  maxPets: number;
  features: {
    adaptiveDietPlans: boolean;
    advancedNutrition: boolean;
    unlimitedReminders: boolean;
    householdSharing: boolean;
    vetReports: boolean;
    wellnessInsights: boolean;
    expandedAi: boolean;
    dietHistory: boolean;
  };
  aiDailyLimit: number;
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Essential care for one pet",
    maxPets: 1,
    features: {
      adaptiveDietPlans: false,
      advancedNutrition: false,
      unlimitedReminders: false,
      householdSharing: false,
      vetReports: false,
      wellnessInsights: false,
      expandedAi: false,
      dietHistory: false,
    },
    aiDailyLimit: 20,
  },
  plus: {
    id: "plus",
    name: "Animivo Plus",
    description: "Complete nutrition and care for every pet in your home",
    maxPets: 10,
    features: {
      adaptiveDietPlans: true,
      advancedNutrition: true,
      unlimitedReminders: true,
      householdSharing: true,
      vetReports: true,
      wellnessInsights: true,
      expandedAi: true,
      dietHistory: true,
    },
    aiDailyLimit: 100,
  },
};

export function getPlan(plan: SubscriptionPlan): PlanDefinition {
  return PLAN_DEFINITIONS[plan];
}

export function canAddPet(plan: SubscriptionPlan, currentPetCount: number): boolean {
  return currentPetCount < getPlan(plan).maxPets;
}

export function hasFeature(plan: SubscriptionPlan, feature: keyof PlanDefinition["features"]): boolean {
  return getPlan(plan).features[feature];
}
