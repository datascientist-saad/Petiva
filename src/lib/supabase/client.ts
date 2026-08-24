import { createBrowserClient } from "@supabase/ssr";

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, key, isConfigured: Boolean(url && key) };
}

export function createClient() {
  const { url, key, isConfigured } = getSupabasePublicConfig();

  if (!isConfigured) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local (or set Vercel env vars) and restart the server."
    );
  }

  return createBrowserClient(url, key);
}
