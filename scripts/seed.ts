/**
 * Development seed script — DO NOT run against production automatically.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
 *   SEED_EMAIL=demo@animivo.app SEED_PASSWORD=demo-demo-demo \
 *   npm run seed
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_EMAIL ?? "demo@animivo.app";
const password = process.env.SEED_PASSWORD ?? "demo-demo-demo";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Seeding Animivo demo data…");

  const existing = await admin.auth.admin.listUsers({ perPage: 200 });
  let userId = existing.data.users.find((u) => u.email === email)?.id;

  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Demo Owner" },
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error("Failed to create demo user");
    }
    userId = created.data.user.id;
  }

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: "Demo Owner",
    timezone: "America/New_York",
  });

  // Clean previous demo pets by name for this owner
  const { data: oldPets } = await admin.from("pets").select("id").eq("owner_id", userId);
  if (oldPets?.length) {
    await admin.from("pets").delete().in(
      "id",
      oldPets.map((p) => p.id)
    );
  }

  const { data: luna, error: lunaError } = await admin
    .from("pets")
    .insert({
      owner_id: userId,
      name: "Luna",
      species: "cat",
      breed: "British Shorthair",
      birth_date: "2023-03-01",
      sex: "female",
      weight_kg: 4.8,
      neutered: "yes",
      activity_level: "moderate",
      food_brand: "Royal Canin",
      food_product: "Indoor Adult",
      food_type: "dry",
      daily_food_target: 80,
      food_unit: "grams",
      meals_per_day: 2,
      onboarding_completed: true,
    })
    .select("*")
    .single();
  if (lunaError || !luna) throw lunaError;

  const { data: bruno, error: brunoError } = await admin
    .from("pets")
    .insert({
      owner_id: userId,
      name: "Bruno",
      species: "dog",
      breed: "Labrador Retriever",
      birth_date: "2021-06-15",
      sex: "male",
      weight_kg: 28.5,
      neutered: "yes",
      activity_level: "high",
      food_brand: "Hill's",
      food_product: "Science Diet Adult",
      food_type: "dry",
      daily_food_target: 350,
      food_unit: "grams",
      meals_per_day: 2,
      onboarding_completed: true,
    })
    .select("*")
    .single();
  if (brunoError || !bruno) throw brunoError;

  await admin.from("conditions").insert([
    { pet_id: luna.id, name: "Seasonal allergies" },
  ]);
  await admin.from("allergies").insert([
    { pet_id: luna.id, name: "Chicken" },
  ]);

  const weights = [
    { pet_id: luna.id, weight_kg: 4.5, recorded_at: "2025-12-20T10:00:00Z", created_by: userId },
    { pet_id: luna.id, weight_kg: 4.7, recorded_at: "2026-01-20T10:00:00Z", created_by: userId },
    { pet_id: luna.id, weight_kg: 4.8, recorded_at: "2026-02-20T10:00:00Z", created_by: userId },
    { pet_id: bruno.id, weight_kg: 27.8, recorded_at: "2026-01-10T10:00:00Z", created_by: userId },
    { pet_id: bruno.id, weight_kg: 28.5, recorded_at: "2026-02-20T10:00:00Z", created_by: userId },
  ];
  await admin.from("weight_records").insert(weights);

  await admin.from("vaccinations").insert([
    {
      pet_id: luna.id,
      name: "Rabies",
      administered_date: "2025-09-18",
      next_due_date: "2026-09-18",
      clinic: "Greenfield Vet",
      veterinarian: "Dr. Patel",
      status: "upcoming",
    },
    {
      pet_id: bruno.id,
      name: "DHPP",
      administered_date: "2025-11-01",
      next_due_date: "2026-11-01",
      clinic: "Greenfield Vet",
      status: "upcoming",
    },
  ]);

  await admin.from("medications").insert({
    pet_id: luna.id,
    name: "Amoxicillin",
    dose: "2.5",
    unit: "ml",
    frequency: "Twice daily",
    start_date: "2026-03-01",
    end_date: "2026-03-14",
    instructions: "Give with food",
    status: "active",
  });

  const today = new Date();
  const breakfast = new Date(today);
  breakfast.setHours(8, 0, 0, 0);
  await admin.from("meal_logs").insert([
    {
      pet_id: luna.id,
      food_name: "Royal Canin Indoor Adult",
      amount: 40,
      unit: "grams",
      logged_at: breakfast.toISOString(),
      created_by: userId,
    },
  ]);

  const { data: tasks } = await admin
    .from("care_tasks")
    .insert([
      {
        pet_id: luna.id,
        title: "Breakfast",
        category: "food",
        frequency: "daily",
        scheduled_time: "08:00",
        next_due_at: breakfast.toISOString(),
        created_by: userId,
      },
      {
        pet_id: luna.id,
        title: "Medication",
        category: "medication",
        frequency: "daily",
        scheduled_time: "14:00",
        next_due_at: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        created_by: userId,
      },
      {
        pet_id: luna.id,
        title: "Dinner",
        category: "food",
        frequency: "daily",
        scheduled_time: "18:00",
        next_due_at: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
        created_by: userId,
      },
      {
        pet_id: luna.id,
        title: "Play / Activity",
        category: "activity",
        frequency: "daily",
        scheduled_time: "19:00",
        notes: "20 minutes",
        next_due_at: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
        created_by: userId,
      },
    ])
    .select("*");

  if (tasks?.[0]) {
    await admin.from("task_completions").insert({
      care_task_id: tasks[0].id,
      pet_id: luna.id,
      completed_by: userId,
      completed_at: breakfast.toISOString(),
    });
  }

  await admin.from("medical_records").insert({
    pet_id: luna.id,
    title: "Annual checkup notes",
    record_type: "vet_visit",
    record_date: "2026-02-12",
    clinic: "Greenfield Vet",
    veterinarian: "Dr. Patel",
    notes: "Healthy overall. Continue current diet.",
    created_by: userId,
  });

  await admin.from("symptoms").insert({
    pet_id: luna.id,
    symptom: "Reduced appetite",
    severity: "mild",
    started_at: "2026-03-10T09:00:00Z",
    status: "resolved",
    resolved_at: "2026-03-12T09:00:00Z",
    description: "Skipped one meal, back to normal.",
    created_by: userId,
  });

  await admin.from("notifications").insert([
    {
      user_id: userId,
      pet_id: luna.id,
      title: "Rabies vaccination reminder",
      body: "Luna's rabies vaccination is due in a few months — keep an eye on the date.",
      type: "vaccination",
    },
    {
      user_id: userId,
      pet_id: luna.id,
      title: "Medication scheduled",
      body: "Medication is scheduled for 2:00 PM.",
      type: "medication",
    },
  ]);

  console.log("Seed complete.");
  console.log(`Login: ${email} / ${password}`);
  console.log(`Pets: Luna (${luna.id}), Bruno (${bruno.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
