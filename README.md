# Animivo

**Every pet. One smarter care plan.**

Animivo is a personalized nutrition, health, and preventive-care platform for companion animals. It creates evolving care plans from structured calculations—not guesswork—and helps owners track meals, weight, medications, vaccinations, symptoms, and daily care tasks with species-aware guidance.

Supported species in this release: **cat**, **dog**, and **bird**. The architecture is prepared for rabbit, guinea pig, hamster, reptile, fish, and other companions without another major schema rewrite.

## Product positioning

Animivo creates an evolving nutrition, health, and preventive-care plan for every pet. It is not a generic pet-record app: numerical diet guidance comes from versioned, deterministic engines; AI explains and summarizes but does not invent feeding amounts or diagnoses.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, Postgres, RLS, Storage)
- **AI:** OpenAI via server-side abstraction (safe fallback when `OPENAI_API_KEY` is missing)
- **Charts:** Recharts
- **Deploy:** Vercel-ready

## Architecture

```
src/
  app/                    # Routes (marketing, auth, app, APIs)
  components/             # UI + feature components
  contexts/               # Pet + user providers
  lib/
    brand.ts              # Central Animivo branding
    species/registry.ts   # Species capabilities (do not scatter species checks)
    nutrition/            # Mammal + bird engines, reference data
    wellness/             # Rule-based insight generation
    entitlements/         # Free / Animivo Plus plans
    i18n/                 # EN + partial AR strings (RTL-ready)
  services/               # PetService, DietPlanService, AIService, …
  types/
supabase/migrations/      # Incremental schema + RLS
docs/
  DOMAIN_SAFETY.md        # Deterministic vs AI boundaries
  ANIMIVO_ROADMAP.md      # Release scope and future work
scripts/seed.ts           # Optional dev seed (never auto-run in prod)
```

Domain logic lives in `src/services` and `src/lib`. React components must not embed nutrition formulas, medical rules, or AI prompts.

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
   - Site URL: `http://localhost:3000` (and your production URL)
   - Redirect URLs: `/auth/callback`, reset-password URLs
3. Enable **Email** provider (password login).
4. Apply migrations in order:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migrations:

| File | Purpose |
|---|---|
| `20260323000000_pawly_init.sql` | Core schema, RLS, storage |
| `20260831000000_animivo_expansion.sql` | Bird support, food catalogue, diet check-ins, wellness insights, habitat, subscriptions |

The expansion migration adds bird species, `species_profile` JSONB, food products, nutrition profiles, diet plan versioning items, diet check-ins, wellness insights, bird habitat assessments, expanded caregiver roles, and subscription fields—without destroying existing cat/dog data.

### RLS

Every pet-scoped table uses `user_has_pet_access(pet_id)` or owner helpers. Caregiver permissions are enforced in Postgres, not only in the UI.

## Nutrition engine

- **Cats & dogs:** RER/MER-based deterministic calculator in `src/lib/diet-calculations.ts`
- **Birds:** Separate composition model in `src/lib/nutrition/bird-calculator.ts` using versioned reference data—never dog/cat calorie equations
- **Routing:** `src/lib/nutrition/engine.ts` selects the correct engine by species
- **Versioning:** Diet plans retain full history; adjustments create new versions
- **Check-ins:** `diet_check_ins` table + UI dialog for weekly progress reviews

See `docs/DOMAIN_SAFETY.md` for what AI may and may not do.

## AI safety

- Animivo AI uses the selected pet's authorized context (species, weight, plan, records)
- Emergency language (including bird-specific cues) triggers urgent-care messaging
- AI does not diagnose, invent medication doses, or override veterinarian instructions
- Daily usage limits apply; safe fallbacks when OpenAI is unavailable

## Subscription adapter

Free and **Animivo Plus** entitlements are defined in `src/lib/entitlements/plans.ts` with feature gates in `src/services/entitlement-service.ts`. Billing is behind a server-side adapter—no fake successful payments. Connect Stripe or another provider when credentials exist.

## Localization (GCC-ready)

User-facing strings are structured in `src/lib/i18n/` with English and partial Arabic for high-value screens. Components are RTL-ready; dates and units should use locale-aware formatting as translation expands.

## Local development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Seed demo data (dev only)

```bash
SEED_EMAIL=demo@animivo.app SEED_PASSWORD=demo-demo-demo npm run seed
```

Food catalogue seed is kept separate and is not auto-run in production.

## Deployment to Vercel

1. Push to GitHub and import in Vercel.
2. Add environment variables (including `NEXT_PUBLIC_APP_URL` for production).
3. Update Supabase Auth redirect URLs to the production domain.
4. Apply `20260831000000_animivo_expansion.sql` if not yet applied.
5. Redeploy.

## Testing

Unit tests cover species registry, mammal and bird nutrition, entitlements, wellness insight rules, onboarding transfer, and core calculations.

```bash
npm test
```

### Manual QA checklist

1. Pre-signup onboarding: cat, dog, and bird flows with Back navigation
2. Signup → draft transfers to pet profile and diet plan
3. Mixed-species household: switch pets; species-appropriate dashboard cards
4. Log meal, weight (grams for birds), medication, care task
5. Diet check-in saves and does not overwrite plan history
6. Bird habitat & safety checklist
7. Veterinary report: print/PDF, authorization enforced
8. Animivo AI with selected pet context; emergency wording escalates
9. Caregiver invite: RLS blocks unauthorized access
10. Upgrade screen and entitlements (Free vs Plus)
11. Mobile, tablet, and desktop layouts

## Bird support limitations

- Bird nutrition provides conservative composition guidance from reference data—not therapeutic avian diets
- Vaccination requirements are not auto-generated for birds; record per avian-veterinary advice
- Habitat safety checklist is educational, not a professional home-safety certification
- Incomplete reference data is labeled as general guidance requiring avian-vet confirmation

## Privacy

- `/privacy`, `/terms`, `/ai-disclaimer`
- Aggregate admin analytics exclude individual medical details

## Documentation

- `docs/DOMAIN_SAFETY.md` — deterministic vs AI boundaries
- `docs/ANIMIVO_ROADMAP.md` — implemented, prepared, and planned features

## License

Private pilot software — all rights reserved.
