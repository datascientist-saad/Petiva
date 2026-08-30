import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  draftToDietInput,
  draftToWeightKg,
  mapDraftActivity,
  mapDraftFoodType,
} from "@/lib/onboarding-draft";
import { calculateDietPlan } from "@/lib/diet-calculations";
import type { OnboardingDraftData } from "@/types/onboarding-draft";
import type { Pet } from "@/types/database";
import { CareTaskService } from "@/services/care-task-service";
import { DietPlanService } from "@/services/diet-plan-service";
import { WeightService } from "@/services/nutrition-service";
import { PetService } from "@/services/pet-service";

function buildPetPayloadFromDraft(
  draft: OnboardingDraftData,
  userId: string
): Partial<Pet> & { name: string; species: string; owner_id: string } {
  const weightKg = draftToWeightKg(draft);
  const estimatedMonths = draft.use_approximate_age
    ? Number(draft.estimated_age_years || 0) * 12 + Number(draft.estimated_age_months || 0)
    : null;

  return {
    owner_id: userId,
    name: draft.name.trim(),
    species: draft.species,
    breed: draft.breed || null,
    birth_date: draft.use_approximate_age ? null : draft.birth_date || null,
    estimated_age_months: estimatedMonths || null,
    sex: draft.sex || null,
    weight_kg: weightKg,
    weight_unit: draft.weight_unit,
    body_condition: draft.body_condition || null,
    diet_goal: draft.diet_goal || null,
    neutered: draft.neutered,
    activity_level: mapDraftActivity(draft.activity_level),
    activity_level_extended: draft.activity_level || null,
    food_brand: draft.food_brand || null,
    food_product: draft.food_product || null,
    food_type: mapDraftFoodType(draft.food_type),
    meals_per_day: draft.meals_per_day ? Number(draft.meals_per_day) : null,
    calories_per_100g: draft.calories_per_100g ? Number(draft.calories_per_100g) : null,
    calories_per_serving: draft.calories_per_serving ? Number(draft.calories_per_serving) : null,
    mixed_feeding_dry_percent:
      draft.food_type === "mixed" ? Number(draft.mixed_dry_percent) || 50 : null,
    foods_to_avoid: draft.foods_to_avoid || null,
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
    ...draft.health_conditions,
    ...(draft.other_condition.trim() ? [draft.other_condition.trim()] : []),
  ];
  const allergies = draft.allergies
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (conditions.length) await petService.replaceConditions(petId, conditions);
  if (allergies.length) await petService.replaceAllergies(petId, allergies);

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

  const dietInput = draftToDietInput(draft);
  if (dietInput) {
    const dietService = new DietPlanService(supabase);
    await dietService.savePlan(petId, userId, dietInput);
    const plan = calculateDietPlan(dietInput);
    if (plan.dailyFoodGrams) {
      await petService.update(petId, { daily_food_target: plan.dailyFoodGrams, food_unit: "grams" });
    }
  }

  const careService = new CareTaskService(supabase);
  const existingTasks = await careService.list(petId);
  if (existingTasks.length === 0) {
    await careService.generateDefaultCarePlan(
      petId,
      userId,
      draft.name.trim(),
      draft.meals_per_day ? Number(draft.meals_per_day) : null
    );
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
