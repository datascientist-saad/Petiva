import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import type { AppNotification } from "@/types/database";

export class NotificationService {
  constructor(private supabase: SupabaseClient) {}

  async list(userId: string, limit = 40): Promise<AppNotification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new AppError("Could not load notifications.", { cause: error });
    return data ?? [];
  }

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) return 0;
    return count ?? 0;
  }

  async create(input: {
    user_id: string;
    pet_id?: string | null;
    title: string;
    body: string;
    type?: string;
  }) {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: input.user_id,
        pet_id: input.pet_id ?? null,
        title: input.title,
        body: input.body,
        type: input.type ?? "info",
      })
      .select("*")
      .single();
    if (error) throw new AppError("Could not create notification.", { cause: error });
    return data as AppNotification;
  }

  async markRead(id: string) {
    await this.supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async markAllRead(userId: string) {
    await this.supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }
}

export class AnalyticsService {
  constructor(private supabase: SupabaseClient) {}

  async track(eventName: string, userId?: string | null, petId?: string | null, metadata: Record<string, unknown> = {}) {
    const { error } = await this.supabase.from("analytics_events").insert({
      event_name: eventName,
      user_id: userId ?? null,
      pet_id: petId ?? null,
      metadata,
    });
    if (error && process.env.NODE_ENV !== "production") {
      console.error("[Analytics]", error);
    }
  }
}
