import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { toUserMessage } from "@/lib/errors";
import { inviteSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

const createInviteSchema = inviteSchema.extend({
  petId: z.string().uuid(),
});

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { petId, email, role } = parsed.data;

    const { data: pet } = await supabase.from("pets").select("owner_id, name").eq("id", petId).maybeSingle();
    if (!pet || pet.owner_id !== user.id) {
      return NextResponse.json({ error: "You can only invite caregivers to your own pets." }, { status: 403 });
    }

    const admin = createServiceClient();
    const normalizedEmail = email.trim().toLowerCase();
    const token = randomBytes(24).toString("hex");

    const { data: existing } = await admin
      .from("pet_access")
      .select("id, accepted_at")
      .eq("pet_id", petId)
      .eq("invited_email", normalizedEmail)
      .eq("role", "caregiver")
      .maybeSingle();

    if (existing?.accepted_at) {
      return NextResponse.json(
        { error: "This person is already a caregiver for this pet." },
        { status: 409 }
      );
    }

    if (existing) {
      const { data: updated, error: updateError } = await admin
        .from("pet_access")
        .update({
          invite_token: token,
          accepted_at: null,
          user_id: null,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (updateError) throw updateError;

      const inviteUrl = `${appBaseUrl()}/invite/${token}`;
      return NextResponse.json({
        id: updated.id,
        inviteUrl,
        token,
        petName: pet.name,
      });
    }

    const { data, error } = await admin
      .from("pet_access")
      .insert({
        pet_id: petId,
        role,
        invited_email: normalizedEmail,
        invite_token: token,
      })
      .select("id")
      .single();

    if (error) throw error;

    const inviteUrl = `${appBaseUrl()}/invite/${token}`;

    return NextResponse.json({
      id: data.id,
      inviteUrl,
      token,
      petName: pet.name,
    });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 500 });
  }
}
