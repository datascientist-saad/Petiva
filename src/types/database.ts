export type Species = "cat" | "dog" | "bird" | "rabbit" | "guinea_pig" | "hamster" | "reptile" | "fish" | "other";
export type Sex = "male" | "female" | "unknown";
export type NeuteredStatus = "yes" | "no" | "unknown";
export type ActivityLevel = "low" | "moderate" | "high";
export type ExtendedActivityLevel = "low" | "moderate" | "active" | "very_active";
export type BodyCondition = "underweight" | "ideal" | "overweight" | "unsure";
export type DietGoal = "maintain" | "lose" | "gain" | "improve";
export type LifeStage = "baby" | "young" | "adult" | "senior" | "unknown";
export type WeightUnit = "kg" | "lb" | "g";
export type FoodType = "dry" | "wet" | "mixed" | "raw" | "other";
export type FoodUnit = "grams" | "cans" | "portions";
export type PetAccessRole = "owner" | "co_owner" | "caregiver" | "view_only";
export type VaccinationStatus = "upcoming" | "completed" | "overdue";
export type MedicationStatus = "active" | "past";
export type SymptomSeverity = "mild" | "moderate" | "severe";
export type SymptomStatus = "active" | "resolved";
export type CareCategory =
  | "food"
  | "medication"
  | "vaccination"
  | "weight"
  | "grooming"
  | "activity"
  | "vet"
  | "custom";
export type CareFrequency = "once" | "daily" | "weekly" | "monthly" | "custom";
export type MedicalRecordType =
  | "vet_visit"
  | "blood_test"
  | "prescription"
  | "vaccination_certificate"
  | "lab_result"
  | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  care_reminders: boolean;
  vaccination_alerts: boolean;
  medication_alerts: boolean;
  weight_suggestions: boolean;
  email_digest: boolean;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: Species;
  breed: string | null;
  birth_date: string | null;
  estimated_age_months: number | null;
  life_stage: LifeStage | null;
  sex: Sex | null;
  weight_kg: number | null;
  weight_unit: WeightUnit;
  body_condition: BodyCondition | null;
  diet_goal: DietGoal | null;
  calories_per_100g: number | null;
  calories_per_serving: number | null;
  foods_to_avoid: string | null;
  vet_diet_notes: string | null;
  mixed_feeding_dry_percent: number | null;
  activity_level_extended: ExtendedActivityLevel | null;
  neutered: NeuteredStatus;
  activity_level: ActivityLevel | null;
  profile_image_url: string | null;
  food_brand: string | null;
  food_product: string | null;
  food_type: FoodType | null;
  daily_food_target: number | null;
  food_unit: FoodUnit;
  meals_per_day: number | null;
  onboarding_completed: boolean;
  species_profile: Record<string, unknown>;
  primary_goal: string | null;
  weight_grams: number | null;
  calculation_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetAccess {
  id: string;
  pet_id: string;
  user_id: string;
  role: PetAccessRole;
  invited_email: string | null;
  invite_token: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface Condition {
  id: string;
  pet_id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface Allergy {
  id: string;
  pet_id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface WeightRecord {
  id: string;
  pet_id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  name: string;
  administered_date: string | null;
  next_due_date: string | null;
  clinic: string | null;
  veterinarian: string | null;
  notes: string | null;
  attachment_url: string | null;
  status: VaccinationStatus;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  pet_id: string;
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  notes: string | null;
  status: MedicationStatus;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: string;
  pet_id: string;
  food_name: string;
  amount: number;
  unit: FoodUnit;
  logged_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CareTask {
  id: string;
  pet_id: string;
  title: string;
  category: CareCategory;
  frequency: CareFrequency;
  custom_interval_days: number | null;
  scheduled_time: string | null;
  next_due_at: string | null;
  active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  care_task_id: string;
  pet_id: string;
  completed_at: string;
  completed_by: string | null;
  notes: string | null;
}

export interface MedicalRecord {
  id: string;
  pet_id: string;
  title: string;
  record_type: MedicalRecordType;
  record_date: string;
  clinic: string | null;
  veterinarian: string | null;
  notes: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Symptom {
  id: string;
  pet_id: string;
  symptom: string;
  severity: SymptomSeverity;
  started_at: string;
  resolved_at: string | null;
  status: SymptomStatus;
  description: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DailyFeedingCompletion {
  id: string;
  pet_id: string;
  completed_by: string | null;
  meal_index: number;
  scheduled_time: string | null;
  completion_date: string;
  completed_at: string;
}

export interface DietPlan {
  id: string;
  pet_id: string;
  created_by: string | null;
  version: number;
  is_current: boolean;
  engine_type?: string | null;
  engine_version?: string | null;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  vet_approved: boolean;
  vet_notes: string | null;
  owner_notes: string | null;
  generated_at: string;
  review_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  pet_id: string | null;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  pet_id: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  pet_id: string | null;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AiUsage {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
}

export type PetWithDetails = Pet & {
  conditions: Condition[];
  allergies: Allergy[];
  role?: PetAccessRole;
};

export interface NutritionProfile {
  id: string;
  pet_id: string;
  engine_type: "mammal" | "bird";
  engine_version: string;
  reference_version: string | null;
  profile: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DietCheckIn {
  id: string;
  pet_id: string;
  created_by: string | null;
  check_in_date: string;
  weight_kg: number | null;
  weight_grams: number | null;
  body_condition: string | null;
  appetite: string | null;
  food_adherence: string | null;
  owner_notes: string | null;
  plan_suitable: boolean | null;
  adjustment_recommended: boolean | null;
  created_at: string;
}

export interface WellnessInsight {
  id: string;
  pet_id: string;
  insight_type: string;
  severity: "normal" | "attention" | "vet_review" | "emergency";
  title: string;
  body: string;
  source_data: Record<string, unknown>;
  rule_version: string;
  requires_vet_review: boolean;
  acknowledged_at: string | null;
  dismissed_at: string | null;
  generated_at: string;
  created_at: string;
}

export interface BirdHabitatAssessment {
  id: string;
  pet_id: string;
  assessed_at: string;
  safety_checklist: Record<string, boolean>;
  created_at: string;
}
