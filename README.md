# Petiva 🐾

Your pet’s health, all in one place.

Petiva is a mobile-first pet health and care companion for cats and dogs. Pet parents create a profile once, then track meals, weight, vaccinations, medications, care tasks, medical records, and get contextual help from Petiva AI.

This repository is a production-quality MVP intended for a small real-user pilot (≈5–10 people).

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, Postgres, RLS, Storage)
- **AI:** OpenAI via a server-side abstraction layer (safe fallback when `OPENAI_API_KEY` is missing)
- **Charts:** Recharts
- **Deploy:** Vercel-ready

## Architecture

```
src/
  app/                 # Routes (marketing, auth, app, APIs)
  components/          # UI + feature components
  contexts/            # Pet + user providers
  features/            # (reserved) domain UI modules
  hooks/
  lib/                 # brand, calculations, validations, supabase clients
  services/            # PetService, CareTaskService, AIService, …
  types/
supabase/migrations/   # Schema + RLS + storage policies
scripts/seed.ts        # Optional demo data (never auto-run in prod)
```

Domain logic lives in `src/services` and `src/lib/calculations`. UI components should not hardcode AI prompts or duplicate age/vaccination/nutrition math.

## Prerequisites

- Node.js 20+
- A Supabase project
- (Optional) OpenAI API key
- Vercel account for deployment

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Admin metrics, seeding |
| `NEXT_PUBLIC_APP_URL` | Yes | Auth redirects + invites |
| `OPENAI_API_KEY` | No | Enables live AI; fallback otherwise |
| `ADMIN_EMAILS` | No | Comma-separated pilot admin emails |
| `AI_DAILY_MESSAGE_LIMIT` | No | Default `20` |

Never expose the service role key to the browser.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → URL configuration**, add:
   - Site URL: `http://localhost:3000` (and your Vercel URL in production)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://YOUR_DOMAIN/auth/callback`, reset-password URLs
3. Enable **Email** provider (password login). Google/Apple can be enabled later using the same auth pages.
4. Apply the migration:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste `supabase/migrations/20260323000000_pawly_init.sql` into the Supabase SQL Editor and run it.

The migration creates:

- Tables: profiles, pets, pet_access, conditions, allergies, weight_records, vaccinations, medications, meal_logs, care_tasks, task_completions, medical_records, symptoms, notifications, ai_conversations, ai_messages, ai_usage, analytics_events
- Triggers for profile creation + owner pet_access
- RLS policies (owner or accepted caregiver)
- Storage buckets: `pet-photos` (public), `medical-files` (private), `symptom-photos` (private)

### RLS

Every pet-scoped table checks `user_has_pet_access(pet_id)` or owner helpers. Changing a pet ID in the URL cannot bypass Postgres policies. Medical files use private storage + signed URLs.

## OpenAI setup

Care plan creation works **without** OpenAI. The key only powers live AI chat answers in `/ai`.

1. Create an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Add it as `OPENAI_API_KEY`:
   - **Local:** paste into `.env.local` (copy from `.env.example`), then restart `npm run dev`.
   - **Production (Vercel):** open your project → **Settings** → **Environment Variables** → add `OPENAI_API_KEY` with your `sk-...` key for **Production** and **Preview** → **Redeploy** the latest deployment.
3. Optional: set `AI_DAILY_MESSAGE_LIMIT` (default `20`) in the same places.
4. Without the key, `/api/ai/chat` still answers factual questions from the pet database context and returns safe educational fallbacks.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Seed demo data (dev only)

```bash
SEED_EMAIL=demo@petiva.app SEED_PASSWORD=demo-demo-demo npm run seed
```

Creates Demo Owner with Luna (cat) and Bruno (dog), plus sample weights, vaccines, meals, tasks, and notifications.

## Branding

Global brand tokens live in `src/lib/brand.ts` (name, tagline, colors). Theme CSS variables are in `src/app/globals.css`.

## Admin access

Set `ADMIN_EMAILS=you@example.com` then visit `/admin` while signed in as that email. The dashboard shows aggregate pilot metrics only.

## Deployment to Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add the same environment variables.
4. Set `NEXT_PUBLIC_APP_URL` to the production URL.
5. Update Supabase Auth redirect URLs to the production domain.
6. Deploy.

## Testing

Unit tests cover core calculations:

- Pet age
- Vaccination overdue / due soon
- Weekly care completion %
- Weight difference
- Food consumed today
- Pet authorization helper

```bash
npm test
```

Manual pilot checklist (must work end-to-end against a real Supabase project):

1. Sign up → onboarding → create Luna
2. Add a second pet → switch pets
3. Log meal → nutrition updates
4. Add weight → chart updates
5. Add vaccination → upcoming care
6. Add medication → health section
7. Create + complete care task → weekly % changes
8. Upload medical record → timeline
9. Ask Petiva AI (selected pet context)
10. Log out / log in → data persists
11. Second user cannot access first user’s pets

## Privacy & AI safety

- `/privacy`, `/terms`, `/ai-disclaimer`
- AI never claims to diagnose; emergency language triggers urgent-care messaging
- No automatic medication dosing advice beyond owner-recorded prescriptions

## Notes / intentional MVP limits

- Web push notifications are not required; in-app notifications are implemented
- Family sharing uses secure invite tokens (caregiver role)
- Only cats and dogs are supported
- Marketplace / GPS / payments / telehealth are explicitly out of scope

## License

Private pilot software — all rights reserved.
