import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { PetService } from "@/services/pet-service";

async function removePrefix(bucket: string, prefix: string) {
  try {
    const admin = createServiceClient();
    const { data } = await admin.storage.from(bucket).list(prefix, { limit: 100 });
    if (!data?.length) return;
    const paths = data.map((file) => `${prefix}/${file.name}`);
    await admin.storage.from(bucket).remove(paths);
  } catch {
    // Service role may be unset in some environments; pet deletion still proceeds.
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pets = await new PetService(supabase).listForUser(user.id);
  const owned = pets.filter((pet) => pet.role === "owner");

  for (const pet of owned) {
    await removePrefix("medical-files", `${user.id}/${pet.id}`);
    await removePrefix("pet-photos", `${user.id}/${pet.id}`);
    await supabase.from("pets").delete().eq("id", pet.id).eq("owner_id", user.id);
  }

  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.signOut();

  try {
    const admin = createServiceClient();
    await admin.auth.admin.deleteUser(user.id);
  } catch {
    // Profile and pets are already removed. Auth user cleanup needs service role.
  }

  return NextResponse.json({ ok: true });
}
