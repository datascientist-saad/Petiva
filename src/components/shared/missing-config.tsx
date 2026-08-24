"use client";

import { brand } from "@/lib/brand";
import { getSupabasePublicConfig } from "@/lib/supabase/client";

export function MissingConfigScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-lg space-y-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">{brand.logoText}</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Almost ready — add Supabase keys
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The app can&apos;t find <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> or{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground/90">
          <li>
            Locally: copy <code className="rounded bg-muted px-1">.env.example</code> to{" "}
            <code className="rounded bg-muted px-1">.env.local</code>, fill the Petiva project keys, then restart{" "}
            <code className="rounded bg-muted px-1">npm run dev</code>.
          </li>
          <li>
            On Vercel: Project Settings → Environment Variables → add the same keys for Production and Preview,
            then redeploy.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Project URL looks like <code>https://tqfxsxwqxidcsmlstbjf.supabase.co</code>
        </p>
      </div>
    </div>
  );
}

export function hasSupabaseConfig() {
  return getSupabasePublicConfig().isConfigured;
}
