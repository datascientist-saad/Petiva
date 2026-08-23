import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, addMonths, addWeeks, setHours, setMinutes } from "date-fns";
import { AppError } from "@/lib/errors";
import type { CareFrequency, CareTask, TaskCompletion } from "@/types/database";

function computeNextDue(
  frequency: CareFrequency,
  scheduledTime: string | null | undefined,
  from = new Date(),
  customIntervalDays?: number | null
): string {
  let base = new Date(from);
  if (scheduledTime) {
    const [h, m] = scheduledTime.split(":").map(Number);
    base = setMinutes(setHours(base, h || 0), m || 0);
  }

  switch (frequency) {
    case "daily":
      return addDays(base, base <= from ? 1 : 0).toISOString();
    case "weekly":
      return addWeeks(base, base <= from ? 1 : 0).toISOString();
    case "monthly":
      return addMonths(base, base <= from ? 1 : 0).toISOString();
    case "custom":
      return addDays(base, customIntervalDays && customIntervalDays > 0 ? customIntervalDays : 1).toISOString();
    case "once":
    default:
      return base.toISOString();
  }
}

export class CareTaskService {
  constructor(private supabase: SupabaseClient) {}

  async list(petId: string): Promise<CareTask[]> {
    const { data, error } = await this.supabase
      .from("care_tasks")
      .select("*")
      .eq("pet_id", petId)
      .eq("active", true)
      .order("scheduled_time", { ascending: true });
    if (error) throw new AppError("Could not load care tasks.", { cause: error });
    return data ?? [];
  }

  async listCompletions(petId: string, sinceIso: string): Promise<TaskCompletion[]> {
    const { data, error } = await this.supabase
      .from("task_completions")
      .select("*")
      .eq("pet_id", petId)
      .gte("completed_at", sinceIso)
      .order("completed_at", { ascending: false });
    if (error) throw new AppError("Could not load task history.", { cause: error });
    return data ?? [];
  }

  async create(
    petId: string,
    userId: string,
    input: {
      title: string;
      category: CareTask["category"];
      frequency: CareFrequency;
      custom_interval_days?: number | null;
      scheduled_time?: string | null;
      notes?: string | null;
      next_due_at?: string | null;
    }
  ) {
    const next_due_at =
      input.next_due_at ??
      computeNextDue(input.frequency, input.scheduled_time, new Date(), input.custom_interval_days);

    const { data, error } = await this.supabase
      .from("care_tasks")
      .insert({
        pet_id: petId,
        title: input.title,
        category: input.category,
        frequency: input.frequency,
        custom_interval_days: input.custom_interval_days ?? null,
        scheduled_time: input.scheduled_time ?? null,
        next_due_at,
        notes: input.notes ?? null,
        created_by: userId,
        active: true,
      })
      .select("*")
      .single();
    if (error) throw new AppError("Could not create care task.", { cause: error });
    return data as CareTask;
  }

  async complete(task: CareTask, userId: string, notes?: string) {
    const { data: completion, error } = await this.supabase
      .from("task_completions")
      .insert({
        care_task_id: task.id,
        pet_id: task.pet_id,
        completed_by: userId,
        notes: notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new AppError("Could not complete task.", { cause: error });

    if (task.frequency !== "once") {
      const next = computeNextDue(
        task.frequency,
        task.scheduled_time,
        new Date(),
        task.custom_interval_days
      );
      await this.supabase.from("care_tasks").update({ next_due_at: next }).eq("id", task.id);
    } else {
      await this.supabase.from("care_tasks").update({ active: false }).eq("id", task.id);
    }

    return completion as TaskCompletion;
  }

  async remove(id: string) {
    const { error } = await this.supabase.from("care_tasks").update({ active: false }).eq("id", id);
    if (error) throw new AppError("Could not remove care task.", { cause: error });
  }

  async generateDefaultCarePlan(petId: string, userId: string, petName: string, mealsPerDay?: number | null) {
    const defaults: Array<Parameters<CareTaskService["create"]>[2]> = [
      {
        title: "Morning meal",
        category: "food",
        frequency: "daily",
        scheduled_time: "08:00",
      },
      {
        title: "Evening meal",
        category: "food",
        frequency: "daily",
        scheduled_time: "18:00",
      },
      {
        title: "Play / activity",
        category: "activity",
        frequency: "daily",
        scheduled_time: "19:00",
        notes: "About 20 minutes",
      },
      {
        title: `Weight check for ${petName}`,
        category: "weight",
        frequency: "monthly",
        scheduled_time: "10:00",
      },
      {
        title: "Fresh water check",
        category: "custom",
        frequency: "daily",
        scheduled_time: "09:00",
      },
    ];

    if (mealsPerDay && mealsPerDay >= 3) {
      defaults.splice(1, 0, {
        title: "Midday meal",
        category: "food",
        frequency: "daily",
        scheduled_time: "13:00",
      });
    }

    const created = [];
    for (const item of defaults) {
      created.push(await this.create(petId, userId, item));
    }
    return created;
  }
}
