/**
 * Public Supabase config for the Animivo project.
 * The anon key is safe to expose in the browser (RLS still protects data).
 * Prefer env vars; these defaults keep deploys working if Vercel env is unset.
 */
export const supabasePublicDefaults = {
  url: "https://tqfxsxwqxidcsmlstbjf.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZnhzeHdxeGlkY3NtbHN0YmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTkwMjgsImV4cCI6MjEwMzA5NTAyOH0.h168XvLOVeUT8liHQpfdi5v_dObNZ7GHBVy19NK2XtE",
} as const;
