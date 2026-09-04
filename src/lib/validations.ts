import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(1, "Please enter your name").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  timezone: z.string().min(1),
  notification_preferences: z.object({
    care_reminders: z.boolean(),
    vaccination_alerts: z.boolean(),
    medication_alerts: z.boolean(),
    weight_suggestions: z.boolean(),
    email_digest: z.boolean(),
  }),
});

export const petBasicSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(60),
  species: z.enum(["cat", "dog", "bird"]),
  breed: z.string().max(80).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  estimated_age_months: z.coerce.number().int().min(0).max(400).optional().nullable(),
  sex: z.enum(["male", "female", "unknown"]).optional().nullable(),
  profile_image_url: z.string().url().optional().nullable(),
});

export const petHealthSchema = z.object({
  weight_kg: z.coerce.number().positive().max(200).optional().nullable(),
  neutered: z.enum(["yes", "no", "unknown"]),
  activity_level: z.enum(["low", "moderate", "high"]).optional().nullable(),
  conditions: z.array(z.string().min(1)).default([]),
  allergies: z.array(z.string().min(1)).default([]),
  no_conditions: z.boolean().default(false),
  no_allergies: z.boolean().default(false),
});

export const petFoodSchema = z.object({
  food_brand: z.string().max(80).optional().nullable(),
  food_product: z.string().max(80).optional().nullable(),
  food_type: z.enum(["dry", "wet", "mixed", "raw", "other"]).optional().nullable(),
  meals_per_day: z.coerce.number().int().min(1).max(10).optional().nullable(),
  daily_food_target: z.coerce.number().positive().max(10000).optional().nullable(),
  food_unit: z.enum(["grams", "cans", "portions"]).default("grams"),
});

export const weightSchema = z.object({
  weight_kg: z.coerce.number().positive("Enter a valid weight").max(200),
  recorded_at: z.string().min(1),
  notes: z.string().max(500).optional().nullable(),
});

export const mealSchema = z.object({
  food_name: z.string().min(1, "Food name is required").max(100),
  amount: z.coerce.number().positive("Enter an amount"),
  unit: z.enum(["grams", "cans", "portions"]),
  logged_at: z.string().min(1),
  notes: z.string().max(500).optional().nullable(),
});

export const vaccinationSchema = z.object({
  name: z.string().min(1).max(100),
  administered_date: z.string().optional().nullable(),
  next_due_date: z.string().optional().nullable(),
  clinic: z.string().max(120).optional().nullable(),
  veterinarian: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(["upcoming", "completed", "overdue"]).default("upcoming"),
});

export const medicationSchema = z.object({
  name: z.string().min(1).max(100),
  dose: z.string().min(1).max(50),
  unit: z.string().min(1).max(30),
  frequency: z.string().min(1).max(80),
  start_date: z.string().min(1),
  end_date: z.string().optional().nullable(),
  instructions: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(["active", "past"]).default("active"),
});

export const careTaskSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.enum(["food", "medication", "vaccination", "weight", "grooming", "activity", "vet", "custom"]),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "custom"]),
  custom_interval_days: z.coerce.number().int().positive().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  next_due_at: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const medicalRecordSchema = z.object({
  title: z.string().min(1).max(120),
  record_type: z.enum([
    "vet_visit",
    "blood_test",
    "prescription",
    "vaccination_certificate",
    "lab_result",
    "other",
  ]),
  record_date: z.string().min(1),
  clinic: z.string().max(120).optional().nullable(),
  veterinarian: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const symptomSchema = z.object({
  symptom: z.string().min(1).max(100),
  severity: z.enum(["mild", "moderate", "severe"]),
  started_at: z.string().min(1),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["active", "resolved"]).default("active"),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.literal("caregiver"),
});

export const aiMessageSchema = z.object({
  petId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional().nullable(),
});
