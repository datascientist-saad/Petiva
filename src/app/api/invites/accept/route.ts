import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toUserMessage } from "@/lib/errors";
import { z } from "zod";

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

    const { data: invite, error: findError } = await supabase
      .from("pet_access")
      .select("*, pets(name)")
      .eq("invite_token", token)
      .is("accepted_at", null)
      .maybeSingle();

    if (findError) throw findError;
    if (!invite) {
      return NextResponse.json({ error: "This invite is invalid or has already been used." }, { status: 404 });
    }

    if (invite.invited_email && invite.invited_email !== user.email) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address." },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from("pet_access")
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) throw updateError;

    const petName = (invite.pets as { name: string } | null)?.name ?? "the pet";

    return NextResponse.json({
      success: true,
      petId: invite.pet_id,
      petName,
    });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 500 });
  }
}
