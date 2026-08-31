import imageCompression from "browser-image-compression";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";

export async function uploadPetPhoto(
  supabase: SupabaseClient,
  userId: string,
  petId: string,
  file: File
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });
  const ext = compressed.name.split(".").pop() || "jpg";
  const path = `${userId}/${petId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("pet-photos").upload(path, compressed, {
    upsert: true,
    contentType: compressed.type || "image/jpeg",
  });
  if (error) throw new AppError("Could not upload photo. Please try again.", { cause: error });

  const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
