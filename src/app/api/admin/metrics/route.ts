import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createServiceClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = new Date().toISOString().slice(0, 10);

    const [
      { count: totalUsers },
      { count: totalPets },
      { count: petsOnboarded },
      { data: aiUsage },
      { data: events },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("pets").select("*", { count: "exact", head: true }),
      admin.from("pets").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
      admin.from("ai_usage").select("message_count").eq("usage_date", today),
      admin
        .from("analytics_events")
        .select("event_name")
        .gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    const aiMessagesToday = (aiUsage ?? []).reduce((sum, row) => sum + (row.message_count ?? 0), 0);
    const eventsLast7Days: Record<string, number> = {};
    for (const e of events ?? []) {
      eventsLast7Days[e.event_name] = (eventsLast7Days[e.event_name] ?? 0) + 1;
    }

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalPets: totalPets ?? 0,
      petsOnboarded: petsOnboarded ?? 0,
      aiMessagesToday,
      eventsLast7Days,
    });
  } catch (error) {
    console.error("[admin/metrics]", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
