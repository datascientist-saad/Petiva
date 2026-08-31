import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlan, hasFeature, canAddPet, type SubscriptionPlan } from "@/lib/entitlements/plans";

export class EntitlementService {
  constructor(private supabase: SupabaseClient) {}

  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const { data } = await this.supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", userId)
      .maybeSingle();
    const plan = data?.subscription_plan as SubscriptionPlan | undefined;
    return plan === "plus" ? "plus" : "free";
  }

  async canUserAddPet(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const { count } = await this.supabase
      .from("pets")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    return canAddPet(plan, count ?? 0);
  }

  async userHasFeature(
    userId: string,
    feature: keyof ReturnType<typeof getPlan>["features"]
  ): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return hasFeature(plan, feature);
  }

  getAiDailyLimit(plan: SubscriptionPlan): number {
    return getPlan(plan).aiDailyLimit;
  }
}
