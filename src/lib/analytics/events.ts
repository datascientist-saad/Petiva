/** Privacy-conscious product analytics event names. Never attach pet or medical PII. */
export const AnalyticsEvents = {
  LANDING_CTA_CLICKED: "landing_cta_clicked",
  ONBOARDING_STARTED: "onboarding_started",
  SPECIES_SELECTED: "species_selected",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_VALIDATION_FAILED: "onboarding_validation_failed",
  PREVIEW_REACHED: "preview_reached",
  ONBOARDING_ABANDONED: "onboarding_abandoned",
  ONBOARDING_COMPLETED: "onboarding_completed",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  ACCOUNT_CREATED: "account_created",
  PET_CREATED: "pet_created",
  PET_SAVED: "pet_saved",
  NUTRITION_ESCALATION_DISPLAYED: "nutrition_escalation_displayed",
  FIRST_DIET_PLAN: "first_diet_plan_generated",
  FIRST_MEAL_LOGGED: "first_meal_logged",
  FIRST_WEIGHT_LOGGED: "first_weight_logged",
  FIRST_CARE_TASK: "first_care_task_completed",
  FIRST_AI_QUESTION: "first_ai_question",
  FIRST_CAREGIVER_INVITE: "first_caregiver_invited",
  DIET_CHECK_IN: "first_diet_check_in",
  PLAN_ADJUSTED: "plan_adjusted",
  VET_REPORT_VIEWED: "vet_report_viewed",
  UPGRADE_VIEWED: "upgrade_screen_viewed",
  SUBSCRIPTION_STARTED: "subscription_started",
  AI_MESSAGE_SENT: "ai_message_sent",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export const SENSITIVE_ANALYTICS_KEYS = [
  "name",
  "petName",
  "email",
  "conditions",
  "allergies",
  "message",
  "document",
  "conversation",
  "medical",
] as const;
