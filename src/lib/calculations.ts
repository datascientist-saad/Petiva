import { differenceInDays, differenceInMonths, differenceInYears, parseISO, startOfDay, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { CareTask, FoodUnit, MealLog, Pet, TaskCompletion, Vaccination, WeightRecord } from "@/types/database";

export function calculatePetAge(pet: Pick<Pet, "birth_date" | "estimated_age_months">, now = new Date()): {
  years: number;
  months: number;
  label: string;
  totalMonths: number;
} {
  if (pet.birth_date) {
    const birth = parseISO(pet.birth_date);
    const years = differenceInYears(now, birth);
    const months = differenceInMonths(now, birth) % 12;
    const totalMonths = differenceInMonths(now, birth);
    const label =
      years <= 0
        ? `${Math.max(months, 0)} mo`
        : months === 0
          ? `${years} ${years === 1 ? "year" : "years"}`
          : `${years} ${years === 1 ? "year" : "years"}`;
    return { years, months, label, totalMonths };
  }

  const totalMonths = pet.estimated_age_months ?? 0;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const label =
    years <= 0
      ? `~${months} mo`
      : months === 0
        ? `~${years} ${years === 1 ? "year" : "years"}`
        : `~${years} ${years === 1 ? "year" : "years"}`;
  return { years, months, label, totalMonths };
}

export function daysUntilVaccination(nextDueDate: string | null | undefined, now = new Date()): number | null {
  if (!nextDueDate) return null;
  return differenceInDays(startOfDay(parseISO(nextDueDate)), startOfDay(now));
}

export function isVaccinationOverdue(vaccination: Pick<Vaccination, "next_due_date" | "status">, now = new Date()): boolean {
  if (vaccination.status === "completed") return false;
  const days = daysUntilVaccination(vaccination.next_due_date, now);
  return days !== null && days < 0;
}

export function isVaccinationDueSoon(
  vaccination: Pick<Vaccination, "next_due_date" | "status">,
  withinDays = 14,
  now = new Date()
): boolean {
  if (vaccination.status === "completed") return false;
  const days = daysUntilVaccination(vaccination.next_due_date, now);
  return days !== null && days >= 0 && days <= withinDays;
}

export function resolveVaccinationStatus(
  vaccination: Pick<Vaccination, "next_due_date" | "status" | "administered_date">,
  now = new Date()
): "upcoming" | "completed" | "overdue" {
  if (vaccination.status === "completed" && !vaccination.next_due_date) return "completed";
  if (isVaccinationOverdue(vaccination, now)) return "overdue";
  if (vaccination.status === "completed") return "completed";
  return "upcoming";
}

export function getActiveMedications<T extends { status: string; end_date: string | null }>(
  medications: T[],
  now = new Date()
): T[] {
  return medications.filter((m) => {
    if (m.status !== "active") return false;
    if (!m.end_date) return true;
    return startOfDay(parseISO(m.end_date)) >= startOfDay(now);
  });
}

export function getTodaysCareTasks(
  tasks: CareTask[],
  completions: TaskCompletion[],
  now = new Date()
): Array<CareTask & { completed: boolean; completion?: TaskCompletion }> {
  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  return tasks
    .filter((t) => t.active)
    .filter((t) => {
      if (!t.next_due_at) {
        return t.frequency === "daily";
      }
      const due = new Date(t.next_due_at);
      if (t.frequency === "daily") return true;
      return due >= dayStart && due <= dayEnd;
    })
    .map((task) => {
      const completion = completions.find(
        (c) =>
          c.care_task_id === task.id &&
          isWithinInterval(new Date(c.completed_at), { start: dayStart, end: dayEnd })
      );
      return { ...task, completed: Boolean(completion), completion };
    })
    .sort((a, b) => {
      const aTime = a.scheduled_time ?? "99:99";
      const bTime = b.scheduled_time ?? "99:99";
      return aTime.localeCompare(bTime);
    });
}

export function weeklyCareCompletionPercent(
  tasks: CareTask[],
  completions: TaskCompletion[],
  now = new Date()
): number {
  const active = tasks.filter((t) => t.active);
  if (active.length === 0) return 0;

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const expected = active.reduce((sum, task) => {
    switch (task.frequency) {
      case "daily":
        return sum + 7;
      case "weekly":
      case "once":
      case "monthly":
      case "custom":
        return sum + 1;
      default:
        return sum;
    }
  }, 0);

  if (expected === 0) return 0;

  const done = completions.filter((c) =>
    isWithinInterval(new Date(c.completed_at), { start: weekStart, end: weekEnd })
  ).length;

  return Math.min(100, Math.round((done / expected) * 100));
}

export function foodConsumedToday(meals: MealLog[], unit: FoodUnit, now = new Date()): number {
  const dayStart = startOfDay(now);
  return meals
    .filter((m) => new Date(m.logged_at) >= dayStart && m.unit === unit)
    .reduce((sum, m) => sum + Number(m.amount), 0);
}

export function remainingFoodTarget(consumed: number, target: number | null | undefined): number | null {
  if (target == null) return null;
  return Math.max(0, Number(target) - consumed);
}

export function weightDifference(records: WeightRecord[]): {
  current: number | null;
  previous: number | null;
  diff: number | null;
  overDays: number | null;
} {
  if (!records.length) {
    return { current: null, previous: null, diff: null, overDays: null };
  }
  const sorted = [...records].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const current = Number(sorted[sorted.length - 1].weight_kg);
  const previous = sorted.length > 1 ? Number(sorted[sorted.length - 2].weight_kg) : null;
  const first = Number(sorted[0].weight_kg);
  const overDays =
    sorted.length > 1
      ? differenceInDays(new Date(sorted[sorted.length - 1].recorded_at), new Date(sorted[0].recorded_at))
      : null;
  return {
    current,
    previous,
    diff: previous == null ? null : current - previous,
    overDays,
  };
}

export function weightChangeOverPeriod(records: WeightRecord[]): {
  start: number | null;
  end: number | null;
  change: number | null;
  label: string | null;
} {
  if (records.length < 2) {
    return { start: null, end: null, change: null, label: null };
  }
  const sorted = [...records].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const start = Number(sorted[0].weight_kg);
  const end = Number(sorted[sorted.length - 1].weight_kg);
  const days = differenceInDays(new Date(sorted[sorted.length - 1].recorded_at), new Date(sorted[0].recorded_at));
  const months = Math.max(1, Math.round(days / 30));
  const change = end - start;
  const sign = change > 0 ? "+" : "";
  return {
    start,
    end,
    change,
    label: `${sign}${change.toFixed(1)} kg over ${months} ${months === 1 ? "month" : "months"}`,
  };
}

export function userCanAccessPet(
  userId: string,
  pet: { owner_id: string },
  accessRows: Array<{ user_id: string | null; role: string; accepted_at: string | null }>
): boolean {
  if (pet.owner_id === userId) return true;
  return accessRows.some(
    (row) => row.user_id === userId && (row.role === "owner" || row.accepted_at != null)
  );
}

export function userCanEditPet(
  userId: string,
  pet: { owner_id: string }
): boolean {
  return pet.owner_id === userId;
}

export function speciesEmoji(species: string): string {
  return species === "dog" ? "🐶" : "🐱";
}
