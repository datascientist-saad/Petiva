import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PetService } from "@/services/pet-service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let destination = nextParam || "/home";
      if (user) {
        try {
          const pets = await new PetService(supabase).listForUser(user.id);
          if (pets.length === 0) {
            destination = "/onboarding";
          }
        } catch {
          // keep requested destination
        }
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
