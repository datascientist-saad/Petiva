import type { SupabaseClient } from "@supabase/supabase-js";
import {
  draftToDietInput,
  draftToWeightKg,
  mapDraftActivity,
  mapDraftFoodType,
} from "@/lib/onboarding-draft";
import { calculateDietPlan } from "@/lib/diet-calculations";
import type { OnboardingDraftData } from "@/types/onboarding-draft";
import { CareTaskService } from "@/services/care-task-service";
import { DietPlanService } from "@/services/diet-plan-service";
import { PetService } from "@/services/pet-service";

export async function transferOnboardingDraft(
  supabase: SupabaseClient,
  userId: string,
  draft: OnboardingDraftData
): Promise<{ petId: string; petName: string }> {
  const petService = new PetService(supabase);
  const existing = await petService.listForUser(userId);
  const duplicate = existing.find(
    (p) => p.name.toLowerCase() === draft.name.trim().toLowerCase() && p.onboarding_completed
  );
  if (duplicate) {
    return { petId: duplicate.id, petName: duplicate.name };
  }

  const weightKg = draftToWeightKg(draft);
  const estimatedMonths = draft.use_approximate_age
    ? Number(draft.estimated_age_years || 0) * 12 + Number(draft.estimated_age_months || 0)
    : null;

  const conditions = [
    ...draft.health_conditions,
    ...(draft.other_condition.trim() ? [draft.other_condition.trim()] : []),
  ];
  const allergies = draft.allergies
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const pet = await petService.create({
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
  });

  if (conditions.length) await petService.replaceConditions(pet.id, conditions);
  if (allergies.length) await petService.replaceAllergies(pet.id, allergies);

  const dietInput = draftToDietInput(draft);
  if (dietInput) {
    const dietService = new DietPlanService(supabase);
    await dietService.savePlan(pet.id, userId, dietInput);
    const plan = calculateDietPlan(dietInput);
    if (plan.dailyFoodGrams) {
      await petService.update(pet.id, { daily_food_target: plan.dailyFoodGrams, food_unit: "grams" });
    }
  }

  const careService = new CareTaskService(supabase);
  await careService.generateDefaultCarePlan(
    pet.id,
    userId,
    pet.name,
    draft.meals_per_day ? Number(draft.meals_per_day) : null
  );

  return { petId: pet.id, petName: pet.name };
}
