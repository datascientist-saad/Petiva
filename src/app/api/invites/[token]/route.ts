import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { toUserMessage } from "@/lib/errors";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token?.trim()) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 400 });
    }

    const admin = createServiceClient();
    const { data: invite, error } = await admin
      .from("pet_access")
      .select("id, invited_email, accepted_at, pets(name)")
      .eq("invite_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!invite || invite.accepted_at) {
      return NextResponse.json({ error: "This invite is invalid or has already been used." }, { status: 404 });
    }

    const pets = invite.pets as { name: string } | { name: string }[] | null;
    const petName = Array.isArray(pets) ? pets[0]?.name : pets?.name;

    return NextResponse.json({
      petName: petName ?? "your pet",
      invitedEmail: invite.invited_email,
    });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 500 });
  }
}
