-- Animivo expansion migration
-- Rollback notes: new tables can be dropped in reverse order; species constraint can be reverted to cat/dog only after migrating bird pets.

-- ---------------------------------------------------------------------------
-- Species & profile extensions
-- ---------------------------------------------------------------------------

alter table public.pets drop constraint if exists pets_species_check;
alter table public.pets add constraint pets_species_check
  check (species in ('cat', 'dog', 'bird', 'rabbit', 'guinea_pig', 'hamster', 'reptile', 'fish', 'other'));

alter table public.pets drop constraint if exists pets_sex_check;
alter table public.pets add constraint pets_sex_check
  check (sex is null or sex in ('male', 'female', 'unknown'));

alter table public.pets
  add column if not exists species_profile jsonb not null default '{}'::jsonb,
  add column if not exists primary_goal text,
  add column if not exists weight_grams numeric(10,2),
  add column if not exists calculation_version text;

alter table public.pets drop constraint if exists pets_weight_unit_check;
alter table public.pets add constraint pets_weight_unit_check
  check (weight_unit in ('kg', 'lb', 'g'));

comment on column public.pets.species_profile is 'Species-specific structured profile (bird habitat, feeding composition, etc.)';

-- ---------------------------------------------------------------------------
-- Caregiver roles & permissions
-- ---------------------------------------------------------------------------

alter table public.pet_access drop constraint if exists pet_access_role_check;
alter table public.pet_access add constraint pet_access_role_check
  check (role in ('owner', 'co_owner', 'caregiver', 'view_only'));

alter table public.pet_access
  add column if not exists permissions jsonb not null default '{
    "view_records": true,
    "log_meals": true,
    "complete_tasks": true,
    "log_medication": true,
    "edit_plans": false,
    "manage_caregivers": false,
    "export_reports": true
  }'::jsonb;

-- ---------------------------------------------------------------------------
-- User locale & subscription
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists locale text not null default 'en' check (locale in ('en', 'ar')),
  add column if not exists subscription_plan text not null default 'free' check (subscription_plan in ('free', 'plus')),
  add column if not exists subscription_status text not null default 'active',
  add column if not exists billing_provider text,
  add column if not exists billing_customer_id text;

-- ---------------------------------------------------------------------------
-- Food product catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.food_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_codes text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.food_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.food_brands(id) on delete set null,
  name text not null,
  species text[] not null default '{}',
  life_stage text,
  food_form text check (food_form in ('dry', 'wet', 'pellet', 'seed', 'fresh', 'other')),
  package_size text,
  barcode text,
  country_codes text[] default '{}',
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'reviewed', 'verified')),
  data_source text,
  last_reviewed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_product_nutrients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.food_products(id) on delete cascade,
  calories_per_100g numeric(8,2),
  protein_percent numeric(5,2),
  fat_percent numeric(5,2),
  fibre_percent numeric(5,2),
  moisture_percent numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists public.food_serving_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.food_products(id) on delete cascade,
  label text not null,
  grams numeric(10,2),
  created_at timestamptz not null default now()
);

create index if not exists food_products_species_idx on public.food_products using gin (species);

-- ---------------------------------------------------------------------------
-- Nutrition profiles & diet extensions
-- ---------------------------------------------------------------------------

create table if not exists public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade unique,
  engine_type text not null check (engine_type in ('mammal', 'bird')),
  engine_version text not null,
  reference_version text,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diet_plans
  add column if not exists engine_type text default 'mammal',
  add column if not exists engine_version text,
  add column if not exists adjustment_reason text,
  add column if not exists parent_plan_id uuid references public.diet_plans(id) on delete set null;

create table if not exists public.diet_plan_items (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans(id) on delete cascade,
  item_type text not null,
  label text not null,
  amount numeric(10,2),
  unit text,
  schedule_time text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists diet_plan_items_plan_idx on public.diet_plan_items(diet_plan_id);

create table if not exists public.diet_check_ins (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  check_in_date date not null default current_date,
  weight_kg numeric(8,2),
  weight_grams numeric(10,2),
  body_condition text,
  appetite text,
  food_adherence text,
  treat_intake text,
  activity_change text,
  stool_observation text,
  food_acceptance text,
  new_condition text,
  owner_notes text,
  plan_suitable boolean,
  adjustment_recommended boolean,
  created_at timestamptz not null default now()
);

create index if not exists diet_check_ins_pet_date_idx on public.diet_check_ins(pet_id, check_in_date desc);

create table if not exists public.food_transitions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  from_food text,
  to_food text,
  start_date date not null default current_date,
  duration_weeks integer not null default 4,
  schedule jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.body_condition_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  score text not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Wellness insights (persisted)
-- ---------------------------------------------------------------------------

create table if not exists public.wellness_insights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  insight_type text not null,
  severity text not null check (severity in ('normal', 'attention', 'vet_review', 'emergency')),
  title text not null,
  body text not null,
  source_data jsonb not null default '{}'::jsonb,
  rule_version text not null,
  requires_vet_review boolean not null default false,
  acknowledged_at timestamptz,
  dismissed_at timestamptz,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists wellness_insights_pet_idx on public.wellness_insights(pet_id, generated_at desc);

-- ---------------------------------------------------------------------------
-- Bird habitat & safety
-- ---------------------------------------------------------------------------

create table if not exists public.bird_habitat_assessments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  assessed_at timestamptz not null default now(),
  cage_width_cm numeric(8,2),
  cage_depth_cm numeric(8,2),
  cage_height_cm numeric(8,2),
  bar_spacing_mm numeric(6,2),
  perch_variety text,
  enrichment_notes text,
  cleaning_routine text,
  sleep_hours numeric(4,1),
  out_of_cage_hours numeric(4,1),
  temperature_c numeric(5,1),
  humidity_percent numeric(5,1),
  sunlight_exposure text,
  safety_checklist jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bird_habitat_pet_idx on public.bird_habitat_assessments(pet_id, assessed_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger food_products_updated_at before update on public.food_products
for each row execute function public.set_updated_at();

create trigger nutrition_profiles_updated_at before update on public.nutrition_profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.food_brands enable row level security;
alter table public.food_products enable row level security;
alter table public.food_product_nutrients enable row level security;
alter table public.food_serving_options enable row level security;
alter table public.nutrition_profiles enable row level security;
alter table public.diet_plan_items enable row level security;
alter table public.diet_check_ins enable row level security;
alter table public.food_transitions enable row level security;
alter table public.body_condition_records enable row level security;
alter table public.wellness_insights enable row level security;
alter table public.bird_habitat_assessments enable row level security;

-- Read-only catalogue for authenticated users
create policy "Read food brands" on public.food_brands for select to authenticated using (true);
create policy "Read food products" on public.food_products for select to authenticated using (true);
create policy "Read food nutrients" on public.food_product_nutrients for select to authenticated using (true);
create policy "Read food servings" on public.food_serving_options for select to authenticated using (true);

-- Pet-scoped tables
create policy "Access nutrition profiles" on public.nutrition_profiles for select using (public.user_has_pet_access(pet_id));
create policy "Write nutrition profiles" on public.nutrition_profiles for insert with check (public.user_can_write_pet(pet_id));
create policy "Update nutrition profiles" on public.nutrition_profiles for update using (public.user_can_write_pet(pet_id));

create policy "Access diet plan items" on public.diet_plan_items for select
  using (exists (select 1 from public.diet_plans dp where dp.id = diet_plan_id and public.user_has_pet_access(dp.pet_id)));
create policy "Write diet plan items" on public.diet_plan_items for insert
  with check (exists (select 1 from public.diet_plans dp where dp.id = diet_plan_id and public.user_can_write_pet(dp.pet_id)));

create policy "Access diet check-ins" on public.diet_check_ins for select using (public.user_has_pet_access(pet_id));
create policy "Write diet check-ins" on public.diet_check_ins for insert with check (public.user_can_write_pet(pet_id));

create policy "Access food transitions" on public.food_transitions for select using (public.user_has_pet_access(pet_id));
create policy "Write food transitions" on public.food_transitions for insert with check (public.user_can_write_pet(pet_id));
create policy "Update food transitions" on public.food_transitions for update using (public.user_can_write_pet(pet_id));

create policy "Access body condition records" on public.body_condition_records for select using (public.user_has_pet_access(pet_id));
create policy "Write body condition records" on public.body_condition_records for insert with check (public.user_can_write_pet(pet_id));

create policy "Access wellness insights" on public.wellness_insights for select using (public.user_has_pet_access(pet_id));
create policy "Write wellness insights" on public.wellness_insights for insert with check (public.user_can_write_pet(pet_id));
create policy "Update wellness insights" on public.wellness_insights for update using (public.user_can_write_pet(pet_id));

create policy "Access bird habitat" on public.bird_habitat_assessments for select using (public.user_has_pet_access(pet_id));
create policy "Write bird habitat" on public.bird_habitat_assessments for insert with check (public.user_can_write_pet(pet_id));
create policy "Update bird habitat" on public.bird_habitat_assessments for update using (public.user_can_write_pet(pet_id));
