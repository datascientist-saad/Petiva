import { differenceInDays, parseISO } from "date-fns";
import type { CareTask, DietPlan, Pet, TaskCompletion, Vaccination, WeightRecord } from "@/types/database";
import { getTodaysCareTasks } from "@/lib/calculations";

export type InsightSeverity = "normal" | "attention" | "vet_review" | "emergency";

export interface InsightCandidate {
  insightType: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  requiresVetReview: boolean;
  sourceData: Record<string, unknown>;
}

export const INSIGHT_RULE_VERSION = "2026.08.31";

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  emergency: 4,
  vet_review: 3,
  attention: 2,
  normal: 1,
};

export function pickTopInsight(candidates: InsightCandidate[]): InsightCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
}

export function evaluateWellnessInsights(input: {
  pet: Pet;
  weightRecords: WeightRecord[];
  vaccinations: Vaccination[];
  tasks: CareTask[];
  completions: TaskCompletion[];
  dietPlan: DietPlan | null;
  now?: Date;
}): InsightCandidate[] {
  const now = input.now ?? new Date();
  const insights: InsightCandidate[] = [];
  const petName = input.pet.name;

  const overdueVax = input.vaccinations.filter((v) => {
    if (v.status === "completed" || !v.next_due_date) return false;
    return differenceInDays(parseISO(v.next_due_date), now) < 0;
  });
  if (overdueVax.length > 0) {
    insights.push({
      insightType: "vaccination_overdue",
      severity: "vet_review",
      title: "Vaccination overdue",
      body: `${petName} has ${overdueVax.length} vaccination record(s) past due. Schedule a visit with your veterinarian.`,
      requiresVetReview: true,
      sourceData: { count: overdueVax.length },
    });
  }

  const sortedWeights = [...input.weightRecords].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  if (sortedWeights.length >= 2) {
    const latest = Number(sortedWeights[0].weight_kg);
    const previous = Number(sortedWeights[1].weight_kg);
    const daysApart = differenceInDays(
      parseISO(sortedWeights[0].recorded_at),
      parseISO(sortedWeights[1].recorded_at)
    );
    const pctChange = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    if (daysApart <= 21 && Math.abs(pctChange) >= 10) {
      insights.push({
        insightType: "weight_trend",
        severity: "attention",
        title: "Notable weight change",
        body: `${petName}'s weight changed by about ${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}% over ${daysApart} days. Log regularly and discuss sustained changes with your vet.`,
        requiresVetReview: false,
        sourceData: { pctChange, daysApart },
      });
    }
    if (sortedWeights.length >= 3) {
      const third = Number(sortedWeights[2].weight_kg);
      const spanDays = differenceInDays(
        parseISO(sortedWeights[0].recorded_at),
        parseISO(sortedWeights[2].recorded_at)
      );
      if (spanDays >= 21 && Math.abs(latest - third) < 0.02) {
        insights.push({
          insightType: "weight_plateau",
          severity: "attention",
          title: "Weight has plateaued",
          body: `${petName}'s weight has been stable for several weeks. If you're working toward a goal, a diet check-in may help.`,
          requiresVetReview: false,
          sourceData: { spanDays },
        });
      }
    }
  }

  const todayTasks = getTodaysCareTasks(input.tasks, input.completions, now);
  const overdueTasks = todayTasks.filter((t) => !t.completed);
  if (overdueTasks.length >= 3) {
    insights.push({
      insightType: "care_tasks_behind",
      severity: "attention",
      title: "Care tasks need attention",
      body: `${overdueTasks.length} scheduled care items for today are still open for ${petName}.`,
      requiresVetReview: false,
      sourceData: { openCount: overdueTasks.length },
    });
  }

  if (input.dietPlan?.review_by) {
    const reviewDays = differenceInDays(parseISO(input.dietPlan.review_by), now);
    if (reviewDays <= 0) {
      insights.push({
        insightType: "diet_review_due",
        severity: "attention",
        title: "Diet plan review due",
        body: `It's time to review ${petName}'s nutrition plan and log a check-in.`,
        requiresVetReview: false,
        sourceData: { reviewBy: input.dietPlan.review_by },
      });
    }
  }

  if (input.pet.species === "bird" && sortedWeights.length === 0) {
    insights.push({
      insightType: "bird_weight_baseline",
      severity: "normal",
      title: "Establish a weight baseline",
      body: `Morning weights help detect illness early in birds. Log ${petName}'s weight at the same time each day.`,
      requiresVetReview: false,
      sourceData: {},
    });
  }

  return insights;
}
