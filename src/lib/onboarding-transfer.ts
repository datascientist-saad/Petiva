import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  draftToDietInput,
  draftToWeightKg,
  draftToWeightGrams,
  draftToBirdNutritionInput,
  mapDraftActivity,
  mapDraftFoodType,
} from "@/lib/onboarding-draft";
import { calculateDietPlan } from "@/lib/diet-calculations";
import { calculateBirdNutrition } from "@/lib/nutrition/bird-calculator";
import { NUTRITION_ENGINE_VERSION } from "@/lib/nutrition/engine";
import { speciesUsesBirdNutrition } from "@/lib/species/registry";
import type { OnboardingDraftData } from "@/types/onboarding-draft";
import { initialOnboardingDraft } from "@/types/onboarding-draft";
import type { Pet } from "@/types/database";
import { logError } from "@/lib/errors";
import { CareTaskService } from "@/services/care-task-service";
import { DietPlanService } from "@/services/diet-plan-service";
import { NutritionProfileService } from "@/services/nutrition-profile-service";
import { WeightService } from "@/services/nutrition-service";
import { PetService } from "@/services/pet-service";

function emptyToNull(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildPetPayloadFromDraft(
  draft: OnboardingDraftData,
  userId: string
): Partial<Pet> & { name: string; species: string; owner_id: string } {
  const isBird = draft.species === "bird";
  const speciesProfile = {
    ...initialOnboardingDraft().species_profile,
    ...(draft.species_profile ?? {}),
  };
  const weightKg = draftToWeightKg(draft);
  const weightGrams = draftToWeightGrams(draft);
  const estimatedMonths = draft.use_approximate_age
    ? Number(draft.estimated_age_years || 0) * 12 + Number(draft.estimated_age_months || 0)
    : null;
  const lifeStage = draft.life_stage || (draft.use_approximate_age ? "unknown" : null);

  return {
    owner_id: userId,
    name: draft.name.trim(),
    species: draft.species,
    breed: emptyToNull(isBird ? speciesProfile.bird_species || draft.breed : draft.breed),
    birth_date: draft.use_approximate_age || !draft.birth_date ? null : draft.birth_date,
    estimated_age_months: estimatedMonths || null,
    life_stage: lifeStage || null,
    sex: draft.sex || null,
    weight_kg: weightKg,
    weight_grams: weightGrams,
    weight_unit: isBird ? "g" : draft.weight_unit === "lb" ? "lb" : "kg",
    body_condition: isBird ? null : draft.body_condition || null,
    diet_goal: isBird ? null : draft.diet_goal || null,
    primary_goal: emptyToNull(draft.primary_goal),
    species_profile: speciesProfile as unknown as Record<string, unknown>,
    calculation_version: NUTRITION_ENGINE_VERSION,
    neutered: draft.neutered || "unknown",
    activity_level: mapDraftActivity(draft.activity_level),
    activity_level_extended: draft.activity_level || null,
    food_brand: emptyToNull(draft.food_brand),
    food_product: emptyToNull(draft.food_product),
    food_type: isBird ? null : mapDraftFoodType(draft.food_type),
    meals_per_day: draft.meals_per_day ? Number(draft.meals_per_day) : null,
    calories_per_100g: isBird ? null : draft.calories_per_100g ? Number(draft.calories_per_100g) : null,
    calories_per_serving: isBird ? null : draft.calories_per_serving ? Number(draft.calories_per_serving) : null,
    mixed_feeding_dry_percent:
      !isBird && draft.food_type === "mixed" ? Number(draft.mixed_dry_percent) || 50 : null,
    foods_to_avoid: emptyToNull(draft.foods_to_avoid),
    food_unit: "grams",
    onboarding_completed: true,
  };
}

async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Pet parent",
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

async function syncDraftDetails(
  supabase: SupabaseClient,
  userId: string,
  petId: string,
  draft: OnboardingDraftData
) {
  const petService = new PetService(supabase);
  const weightKg = draftToWeightKg(draft);

  const conditions = [
    ...(draft.health_conditions ?? []),
    ...(draft.other_condition?.trim() ? [draft.other_condition.trim()] : []),
  ];
  const allergies = (draft.allergies ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    if (conditions.length) await petService.replaceConditions(petId, conditions);
    if (allergies.length) await petService.replaceAllergies(petId, allergies);
  } catch (error) {
    logError("onboarding-health-details", error);
  }

  try {
    if (weightKg) {
      const weightService = new WeightService(supabase);
      const existingWeights = await weightService.list(petId);
      if (existingWeights.length === 0) {
        await weightService.add(petId, userId, {
          weight_kg: weightKg,
          recorded_at: new Date().toISOString(),
          notes: "Initial weight from onboarding",
        });
      } else {
        await petService.update(petId, { weight_kg: weightKg });
      }
    }
  } catch (error) {
    logError("onboarding-weight", error);
  }

  const dietInput = draftToDietInput(draft);
  if (dietInput && !speciesUsesBirdNutrition(draft.species)) {
    try {
      const dietService = new DietPlanService(supabase);
      await dietService.savePlan(petId, userId, dietInput);
      const plan = calculateDietPlan(dietInput);
      if (plan.dailyFoodGrams) {
        await petService.update(petId, { daily_food_target: plan.dailyFoodGrams, food_unit: "grams" });
      }
    } catch (error) {
      logError("onboarding-mammal-diet-plan", error);
    }
  }

  if (speciesUsesBirdNutrition(draft.species)) {
    try {
      const birdInput = draftToBirdNutritionInput(draft);
      const birdPlan = calculateBirdNutrition(birdInput);
      try {
        const nutritionService = new NutritionProfileService(supabase);
        await nutritionService.savePlanResult(petId, draft.species, birdInput, {
          engine: "bird",
          result: birdPlan,
        });
      } catch (error) {
        logError("onboarding-bird-nutrition-profile", error);
      }
      try {
        const dietService = new DietPlanService(supabase);
        await dietService.saveBirdPlan(petId, userId, birdInput, birdPlan);
      } catch (error) {
        logError("onboarding-bird-diet-plan", error);
      }
    } catch (error) {
      logError("onboarding-bird-plan", error);
    }
  }

  try {
    const careService = new CareTaskService(supabase);
    const existingTasks = await careService.list(petId);
    if (existingTasks.length === 0) {
      if (speciesUsesBirdNutrition(draft.species)) {
        const { WellnessInsightService } = await import("@/services/wellness-insight-service");
        const roadmap = new WellnessInsightService(supabase).generateSpeciesRoadmapTasks(
          draft.species,
          draft.name.trim()
        );
        for (const task of roadmap) {
          await careService.create(petId, userId, {
            title: task.title,
            category: task.category,
            frequency: task.frequency,
          });
        }
      } else {
        await careService.generateDefaultCarePlan(
          petId,
          userId,
          draft.name.trim(),
          draft.meals_per_day ? Number(draft.meals_per_day) : null
        );
      }
    }
  } catch (error) {
    logError("onboarding-care-tasks", error);
  }
}

export async function transferOnboardingDraft(
  supabase: SupabaseClient,
  user: User,
  draft: OnboardingDraftData
): Promise<{ petId: string; petName: string }> {
  await ensureProfile(supabase, user);

  const petService = new PetService(supabase);
  const existing = await petService.listForUser(user.id);
  const payload = buildPetPayloadFromDraft(draft, user.id);
  const match = existing.find(
    (pet) =>
      pet.role === "owner" && pet.name.toLowerCase() === draft.name.trim().toLowerCase()
  );

  let pet: Pet;
  if (match) {
    pet = await petService.update(match.id, payload);
  } else {
    pet = await petService.create(payload);
  }

  await syncDraftDetails(supabase, user.id, pet.id, draft);

  return { petId: pet.id, petName: pet.name };
}

/** Always creates a new pet — use when adding another pet from the logged-in app. */
export async function createPetFromOnboardingDraft(
  supabase: SupabaseClient,
  user: User,
  draft: OnboardingDraftData
): Promise<{ petId: string; petName: string }> {
  await ensureProfile(supabase, user);

  const petService = new PetService(supabase);
  const payload = buildPetPayloadFromDraft(draft, user.id);
  const pet = await petService.create(payload);

  await syncDraftDetails(supabase, user.id, pet.id, draft);

  return { petId: pet.id, petName: pet.name };
}
