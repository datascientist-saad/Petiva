import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { getSpeciesDefinition } from "@/lib/species/registry";

export type InsightSeverity = "normal" | "attention" | "vet_review" | "emergency";

export interface WellnessInsightInput {
  petId: string;
  insightType: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  sourceData?: Record<string, unknown>;
  ruleVersion: string;
  requiresVetReview?: boolean;
}

const INSIGHT_RULE_VERSION = "2026.08.31";

export class WellnessInsightService {
  constructor(private supabase: SupabaseClient) {}

  async listForPet(petId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from("wellness_insights")
      .select("*")
      .eq("pet_id", petId)
      .is("dismissed_at", null)
      .order("generated_at", { ascending: false })
      .limit(limit);
    if (error) throw new AppError("Could not load wellness insights.", { cause: error });
    return data ?? [];
  }

  async create(input: WellnessInsightInput) {
    const { data, error } = await this.supabase
      .from("wellness_insights")
      .insert({
        pet_id: input.petId,
        insight_type: input.insightType,
        severity: input.severity,
        title: input.title,
        body: input.body,
        source_data: input.sourceData ?? {},
        rule_version: input.ruleVersion,
        requires_vet_review: input.requiresVetReview ?? false,
      })
      .select("*")
      .single();
    if (error) throw new AppError("Could not save wellness insight.", { cause: error });
    return data;
  }

  async acknowledge(insightId: string) {
    const { error } = await this.supabase
      .from("wellness_insights")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", insightId);
    if (error) throw new AppError("Could not acknowledge insight.", { cause: error });
  }

  generateSpeciesRoadmapTasks(species: string, petName: string) {
    const def = getSpeciesDefinition(species);
    if (def.preventiveCareEngine === "bird") {
      return [
        { title: `Morning weight check for ${petName}`, category: "weight" as const, frequency: "daily" as const },
        { title: "Replace fresh water", category: "food" as const, frequency: "daily" as const },
        { title: "Clean food dishes", category: "food" as const, frequency: "daily" as const },
        { title: "Replace cage liner", category: "custom" as const, frequency: "daily" as const },
        { title: "Full cage cleaning", category: "custom" as const, frequency: "weekly" as const },
        { title: "Rotate toys / enrichment", category: "activity" as const, frequency: "weekly" as const },
        { title: "Feather condition review", category: "custom" as const, frequency: "weekly" as const },
        { title: "Nail and beak check", category: "grooming" as const, frequency: "monthly" as const },
        { title: "Avian wellness exam (vet)", category: "vet" as const, frequency: "custom" as const },
      ];
    }
    return [
      { title: `Weight check for ${petName}`, category: "weight" as const, frequency: "monthly" as const },
      { title: "Review vaccination schedule", category: "vaccination" as const, frequency: "custom" as const },
      { title: "Deworming review", category: "vet" as const, frequency: "custom" as const },
      { title: "Flea/tick prevention review", category: "medication" as const, frequency: "custom" as const },
      { title: "Dental check reminder", category: "vet" as const, frequency: "custom" as const },
      { title: "Diet plan review", category: "food" as const, frequency: "monthly" as const },
    ];
  }

  get ruleVersion() {
    return INSIGHT_RULE_VERSION;
  }
}
