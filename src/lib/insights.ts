import { differenceInDays, parseISO } from "date-fns";
import {
  daysUntilVaccination,
  foodConsumedToday,
  getTodaysCareTasks,
  isVaccinationDueSoon,
  isVaccinationOverdue,
  weeklyCareCompletionPercent,
} from "@/lib/calculations";
import type {
  CareTask,
  MealLog,
  Medication,
  Pet,
  TaskCompletion,
  Vaccination,
  WeightRecord,
} from "@/types/database";

export type InsightLevel = "alert" | "suggestion" | "info";

export interface PetInsight {
  id: string;
  level: InsightLevel;
  title: string;
  body: string;
  href?: string;
}

export function buildPetInsights(input: {
  pet: Pet;
  vaccinations: Vaccination[];
  medications: Medication[];
  weights: WeightRecord[];
  meals: MealLog[];
  tasks: CareTask[];
  completions: TaskCompletion[];
}): PetInsight[] {
  const { pet, vaccinations, medications, weights, meals, tasks, completions } = input;
  const insights: PetInsight[] = [];

  for (const v of vaccinations) {
    if (isVaccinationOverdue(v)) {
      insights.push({
        id: `vax-overdue-${v.id}`,
        level: "alert",
        title: `${v.name} is overdue`,
        body: `${pet.name}'s ${v.name} vaccination needs attention.`,
        href: "/health/vaccinations",
      });
    } else if (isVaccinationDueSoon(v, 14)) {
      const days = daysUntilVaccination(v.next_due_date);
      insights.push({
        id: `vax-soon-${v.id}`,
        level: "alert",
        title: `${v.name} due soon`,
        body:
          days === 0
            ? `${pet.name}'s ${v.name} is due today.`
            : `${pet.name}'s ${v.name} is due in ${days} day${days === 1 ? "" : "s"}.`,
        href: "/health/vaccinations",
      });
    }
  }

  const activeMeds = medications.filter((m) => m.status === "active");
  for (const med of activeMeds) {
    insights.push({
      id: `med-${med.id}`,
      level: "info",
      title: `${med.name} is active`,
      body: `${med.dose} ${med.unit} · ${med.frequency}`,
      href: "/health/medications",
    });
  }

  const latestWeight = [...weights].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  )[0];
  if (!latestWeight) {
    insights.push({
      id: "weight-missing",
      level: "suggestion",
      title: "Add a weight check",
      body: `You haven't logged ${pet.name}'s weight yet.`,
      href: "/health/weight",
    });
  } else if (differenceInDays(new Date(), parseISO(latestWeight.recorded_at)) >= 30) {
    insights.push({
      id: "weight-stale",
      level: "suggestion",
      title: "Weight check suggested",
      body: `You haven't logged ${pet.name}'s weight this month.`,
      href: "/health/weight",
    });
  }

  const todayTasks = getTodaysCareTasks(tasks, completions);
  const incomplete = todayTasks.filter((t) => !t.completed);
  if (incomplete.length > 0) {
    insights.push({
      id: "tasks-today",
      level: "alert",
      title: `${incomplete.length} care item${incomplete.length === 1 ? "" : "s"} left today`,
      body: incomplete.map((t) => t.title).slice(0, 3).join(", "),
      href: "/care",
    });
  }

  if (pet.daily_food_target) {
    const consumed = foodConsumedToday(meals, pet.food_unit);
    if (consumed === 0) {
      insights.push({
        id: "meals-none",
        level: "suggestion",
        title: "No meals logged yet",
        body: `Log ${pet.name}'s meals to track today's nutrition.`,
        href: "/health/nutrition",
      });
    }
  }

  const completion = weeklyCareCompletionPercent(tasks, completions);
  if (completion >= 80) {
    insights.push({
      id: "care-great",
      level: "info",
      title: "Great job this week",
      body: `${pet.name}'s care completion is at ${completion}%.`,
      href: "/home",
    });
  }

  return insights.slice(0, 8);
}
