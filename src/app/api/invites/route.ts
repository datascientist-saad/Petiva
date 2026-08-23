import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toUserMessage } from "@/lib/errors";
import { inviteSchema } from "@/lib/validations";
import { z } from "zod";

const createInviteSchema = inviteSchema.extend({
  petId: z.string().uuid(),
});

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

    const token = randomBytes(24).toString("hex");
    const { data, error } = await supabase
      .from("pet_access")
      .insert({
        pet_id: petId,
        role,
        invited_email: email,
        invite_token: token,
      })
      .select("*")
      .single();

    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;

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
