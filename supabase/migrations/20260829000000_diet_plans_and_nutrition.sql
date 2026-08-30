-- Diet plans, extended nutrition profile, and daily feeding completions

alter table public.pets
  add column if not exists body_condition text
    check (body_condition in ('underweight', 'ideal', 'overweight', 'unsure')),
  add column if not exists weight_unit text not null default 'kg'
    check (weight_unit in ('kg', 'lb')),
  add column if not exists diet_goal text
    check (diet_goal in ('maintain', 'lose', 'gain', 'improve')),
  add column if not exists calories_per_100g numeric(8,2),
  add column if not exists calories_per_serving numeric(8,2),
  add column if not exists foods_to_avoid text,
  add column if not exists vet_diet_notes text,
  add column if not exists mixed_feeding_dry_percent integer
    check (mixed_feeding_dry_percent is null or (mixed_feeding_dry_percent >= 0 and mixed_feeding_dry_percent <= 100)),
  add column if not exists activity_level_extended text
    check (activity_level_extended in ('low', 'moderate', 'active', 'very_active'));

-- Map extended activity to legacy column where possible
comment on column public.pets.activity_level_extended is 'Extended activity scale; legacy activity_level kept for compatibility.';

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  version integer not null default 1,
  is_current boolean not null default true,
  inputs jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  vet_approved boolean not null default false,
  vet_notes text,
  owner_notes text,
  generated_at timestamptz not null default now(),
  review_by date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diet_plans_pet_id_idx on public.diet_plans(pet_id);
create index if not exists diet_plans_current_idx on public.diet_plans(pet_id, is_current) where is_current = true;

create table if not exists public.daily_feeding_completions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  completed_by uuid references public.profiles(id) on delete set null,
  meal_index integer not null check (meal_index >= 0),
  scheduled_time text,
  completion_date date not null default current_date,
  completed_at timestamptz not null default now(),
  unique (pet_id, completion_date, meal_index)
);

create index if not exists daily_feeding_completions_pet_date_idx
  on public.daily_feeding_completions(pet_id, completion_date);

create trigger diet_plans_updated_at before update on public.diet_plans
for each row execute function public.set_updated_at();

alter table public.diet_plans enable row level security;
alter table public.daily_feeding_completions enable row level security;

create policy "Access diet plans"
  on public.diet_plans for select
  using (public.user_has_pet_access(pet_id));

create policy "Write diet plans"
  on public.diet_plans for insert
  with check (public.user_can_write_pet(pet_id));

create policy "Update diet plans"
  on public.diet_plans for update
  using (public.user_can_write_pet(pet_id));

create policy "Delete diet plans"
  on public.diet_plans for delete
  using (public.user_is_pet_owner(pet_id));

create policy "Access feeding completions"
  on public.daily_feeding_completions for select
  using (public.user_has_pet_access(pet_id));

create policy "Write feeding completions"
  on public.daily_feeding_completions for insert
  with check (public.user_can_write_pet(pet_id));

create policy "Delete feeding completions"
  on public.daily_feeding_completions for delete
  using (public.user_can_write_pet(pet_id));
