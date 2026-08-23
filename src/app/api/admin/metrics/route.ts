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

    const [
      usersRes,
      petsRes,
      catsRes,
      dogsRes,
      tasksRes,
      mealsRes,
      weightsRes,
      vaxRes,
      recordsRes,
      aiConvRes,
      recentUsersRes,
      petsWithOwnerRes,
      taskCompletionsRes,
      aiMessagesRes,
      usersWithPetsRes,
      onboardedRes,
      activeUsersRes,
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("pets").select("*", { count: "exact", head: true }),
      admin.from("pets").select("*", { count: "exact", head: true }).eq("species", "cat"),
      admin.from("pets").select("*", { count: "exact", head: true }).eq("species", "dog"),
      admin.from("task_completions").select("*", { count: "exact", head: true }),
      admin.from("meal_logs").select("*", { count: "exact", head: true }),
      admin.from("weight_records").select("*", { count: "exact", head: true }),
      admin.from("vaccinations").select("*", { count: "exact", head: true }),
      admin.from("medical_records").select("*", { count: "exact", head: true }),
      admin.from("ai_conversations").select("*", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      admin.from("pets").select("id, owner_id, onboarding_completed"),
      admin.from("task_completions").select("completed_by"),
      admin.from("ai_messages").select("conversation_id, ai_conversations(user_id)"),
      admin.from("pets").select("owner_id"),
      admin.from("pets").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
      admin
        .from("analytics_events")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    const totalUsers = usersRes.count ?? 0;
    const totalPets = petsRes.count ?? 0;
    const ownersWithPets = new Set((usersWithPetsRes.data ?? []).map((p) => p.owner_id));
    const activationRate = totalUsers ? ownersWithPets.size / totalUsers : 0;
    const onboardingCompletion = totalPets
      ? (onboardedRes.count ?? 0) / totalPets
      : 0;
    const weeklyActiveUsers = new Set(
      (activeUsersRes.data ?? []).map((e) => e.user_id).filter(Boolean)
    ).size;

    const completionsByUser = new Map<string, number>();
    for (const row of taskCompletionsRes.data ?? []) {
      if (!row.completed_by) continue;
      completionsByUser.set(row.completed_by, (completionsByUser.get(row.completed_by) ?? 0) + 1);
    }
    const avgCareTasksPerUser =
      totalUsers > 0
        ? Array.from(completionsByUser.values()).reduce((a, b) => a + b, 0) / totalUsers
        : 0;

    const aiByUser = new Map<string, number>();
    for (const row of aiMessagesRes.data ?? []) {
      const conv = row.ai_conversations as unknown as { user_id?: string } | null;
      const uid = conv?.user_id;
      if (!uid) continue;
      aiByUser.set(uid, (aiByUser.get(uid) ?? 0) + 1);
    }
    const avgAiPerUser =
      totalUsers > 0 ? Array.from(aiByUser.values()).reduce((a, b) => a + b, 0) / totalUsers : 0;

    const petsWithRecords = new Set<string>();
    const { data: recordPets } = await admin.from("medical_records").select("pet_id");
    for (const r of recordPets ?? []) petsWithRecords.add(r.pet_id);
    const medicalRecordUploadRate = totalPets ? petsWithRecords.size / totalPets : 0;

    const petsWithVax = new Set<string>();
    const { data: vaxPets } = await admin.from("vaccinations").select("pet_id");
    for (const r of vaxPets ?? []) petsWithVax.add(r.pet_id);
    const vaccinationTrackingRate = totalPets ? petsWithVax.size / totalPets : 0;

    return NextResponse.json({
      totals: {
        users: totalUsers,
        pets: totalPets,
        cats: catsRes.count ?? 0,
        dogs: dogsRes.count ?? 0,
        tasksCompleted: tasksRes.count ?? 0,
        mealsLogged: mealsRes.count ?? 0,
        weightRecords: weightsRes.count ?? 0,
        vaccinations: vaxRes.count ?? 0,
        medicalRecords: recordsRes.count ?? 0,
        aiConversations: aiConvRes.count ?? 0,
      },
      metrics: {
        activationRate,
        onboardingCompletion,
        weeklyActiveUsers,
        activePets: petsWithOwnerRes.data?.length ?? 0,
        averageCareTasksCompletedPerUser: Number(avgCareTasksPerUser.toFixed(2)),
        averageAiInteractionsPerUser: Number(avgAiPerUser.toFixed(2)),
        medicalRecordUploadRate,
        vaccinationTrackingRate,
      },
      recentRegistrations: recentUsersRes.data ?? [],
    });
  } catch (error) {
    console.error("[admin/metrics]", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
