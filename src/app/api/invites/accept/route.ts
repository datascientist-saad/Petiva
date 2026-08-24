import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { toUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const acceptSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to accept this invite." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invite token." }, { status: 400 });
    }

    const { token } = parsed.data;
    const admin = createServiceClient();

    const { data: invite, error: findError } = await admin
      .from("pet_access")
      .select("id, pet_id, invited_email, accepted_at, pets(name)")
      .eq("invite_token", token)
      .maybeSingle();

    if (findError) throw findError;
    if (!invite || invite.accepted_at) {
      return NextResponse.json({ error: "This invite is invalid or has already been used." }, { status: 404 });
    }

    const invitedEmail = invite.invited_email?.trim().toLowerCase();
    const userEmail = user.email?.trim().toLowerCase();

    if (invitedEmail && userEmail && invitedEmail !== userEmail) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address. Sign in with the invited email." },
        { status: 403 }
      );
    }

    const { data: existingAccess } = await admin
      .from("pet_access")
      .select("id")
      .eq("pet_id", invite.pet_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAccess) {
      await admin
        .from("pet_access")
        .update({
          role: "caregiver",
          accepted_at: new Date().toISOString(),
          invite_token: null,
          invited_email: invitedEmail ?? userEmail ?? null,
        })
        .eq("id", existingAccess.id);

      const pets = invite.pets as { name: string } | { name: string }[] | null;
      const petName = Array.isArray(pets) ? pets[0]?.name : pets?.name;

      return NextResponse.json({
        success: true,
        petId: invite.pet_id,
        petName: petName ?? "the pet",
      });
    }

    const { error: updateError } = await admin
      .from("pet_access")
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
        invite_token: null,
        invited_email: invitedEmail ?? userEmail ?? null,
      })
      .eq("id", invite.id);

    if (updateError) throw updateError;

    const pets = invite.pets as { name: string } | { name: string }[] | null;
    const petName = Array.isArray(pets) ? pets[0]?.name : pets?.name;

    return NextResponse.json({
      success: true,
      petId: invite.pet_id,
      petName: petName ?? "the pet",
    });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 500 });
  }
}
