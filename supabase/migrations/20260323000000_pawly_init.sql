-- Animivo MVP schema with RLS
-- Apply via: supabase db push / migration up / SQL editor

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  notification_preferences jsonb not null default '{
    "care_reminders": true,
    "vaccination_alerts": true,
    "medication_alerts": true,
    "weight_suggestions": true,
    "email_digest": false
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pets
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  species text not null check (species in ('cat', 'dog')),
  breed text,
  birth_date date,
  estimated_age_months integer,
  sex text check (sex in ('male', 'female')),
  weight_kg numeric(8,2),
  neutered text not null default 'unknown' check (neutered in ('yes', 'no', 'unknown')),
  activity_level text check (activity_level in ('low', 'moderate', 'high')),
  profile_image_url text,
  food_brand text,
  food_product text,
  food_type text check (food_type in ('dry', 'wet', 'mixed', 'raw', 'other')),
  daily_food_target numeric(10,2),
  food_unit text not null default 'grams' check (food_unit in ('grams', 'cans', 'portions')),
  meals_per_day integer,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pets_owner_id_idx on public.pets(owner_id);

-- Pet access (owner + caregivers)
create table if not exists public.pet_access (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver')),
  invited_email text,
  invite_token text unique,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (pet_id, user_id)
);

create index if not exists pet_access_user_id_idx on public.pet_access(user_id);
create index if not exists pet_access_pet_id_idx on public.pet_access(pet_id);
create index if not exists pet_access_invite_token_idx on public.pet_access(invite_token);

-- Conditions & allergies
create table if not exists public.conditions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.allergies (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Weight
create table if not exists public.weight_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  weight_kg numeric(8,2) not null,
  recorded_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists weight_records_pet_id_idx on public.weight_records(pet_id, recorded_at desc);

-- Vaccinations
create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  administered_date date,
  next_due_date date,
  clinic text,
  veterinarian text,
  notes text,
  attachment_url text,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vaccinations_pet_id_idx on public.vaccinations(pet_id);

-- Medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  dose text not null,
  unit text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  instructions text,
  notes text,
  status text not null default 'active' check (status in ('active', 'past')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Meals
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  food_name text not null,
  amount numeric(10,2) not null,
  unit text not null default 'grams' check (unit in ('grams', 'cans', 'portions')),
  logged_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists meal_logs_pet_id_idx on public.meal_logs(pet_id, logged_at desc);

-- Care tasks
create table if not exists public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  category text not null check (category in ('food','medication','vaccination','weight','grooming','activity','vet','custom')),
  frequency text not null check (frequency in ('once','daily','weekly','monthly','custom')),
  custom_interval_days integer,
  scheduled_time time,
  next_due_at timestamptz,
  active boolean not null default true,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists care_tasks_pet_id_idx on public.care_tasks(pet_id, next_due_at);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  care_task_id uuid not null references public.care_tasks(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_by uuid references public.profiles(id) on delete set null,
  notes text
);

create index if not exists task_completions_pet_week_idx on public.task_completions(pet_id, completed_at desc);

-- Medical records
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  record_type text not null check (record_type in ('vet_visit','blood_test','prescription','vaccination_certificate','lab_result','other')),
  record_date date not null,
  clinic text,
  veterinarian text,
  notes text,
  attachment_url text,
  attachment_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Symptoms
create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  symptom text not null,
  severity text not null check (severity in ('mild','moderate','severe')),
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  status text not null default 'active' check (status in ('active','resolved')),
  description text,
  image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

-- AI
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default current_date,
  message_count integer not null default 0,
  unique (user_id, usage_date)
);

-- Analytics
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events(event_name, created_at desc);

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger pets_updated_at before update on public.pets
for each row execute function public.set_updated_at();
create trigger vaccinations_updated_at before update on public.vaccinations
for each row execute function public.set_updated_at();
create trigger medications_updated_at before update on public.medications
for each row execute function public.set_updated_at();
create trigger care_tasks_updated_at before update on public.care_tasks
for each row execute function public.set_updated_at();
create trigger medical_records_updated_at before update on public.medical_records
for each row execute function public.set_updated_at();
create trigger ai_conversations_updated_at before update on public.ai_conversations
for each row execute function public.set_updated_at();

-- Auth helper: profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  insert into public.analytics_events (user_id, event_name, metadata)
  values (new.id, 'user_registered', '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Access helpers (security definer, not exposed as RPC for mutation)
create or replace function public.user_has_pet_access(p_pet_id uuid, p_roles text[] default array['owner','caregiver'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pet_access pa
    where pa.pet_id = p_pet_id
      and pa.user_id = auth.uid()
      and pa.role = any(p_roles)
      and (pa.accepted_at is not null or pa.role = 'owner')
  ) or exists (
    select 1 from public.pets p
    where p.id = p_pet_id and p.owner_id = auth.uid()
  );
$$;

create or replace function public.user_is_pet_owner(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pets p where p.id = p_pet_id and p.owner_id = auth.uid()
  );
$$;

create or replace function public.user_can_write_pet(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_pet_access(p_pet_id, array['owner','caregiver']);
$$;

-- Auto-add owner to pet_access
create or replace function public.handle_new_pet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pet_access (pet_id, user_id, role, accepted_at)
  values (new.id, new.owner_id, 'owner', now())
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_pet_created on public.pets;
create trigger on_pet_created
  after insert on public.pets
  for each row execute function public.handle_new_pet();

-- RLS
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_access enable row level security;
alter table public.conditions enable row level security;
alter table public.allergies enable row level security;
alter table public.weight_records enable row level security;
alter table public.vaccinations enable row level security;
alter table public.medications enable row level security;
alter table public.meal_logs enable row level security;
alter table public.care_tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.medical_records enable row level security;
alter table public.symptoms enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage enable row level security;
alter table public.analytics_events enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Pets
create policy "Users can view accessible pets"
  on public.pets for select using (public.user_has_pet_access(id));
create policy "Users can insert own pets"
  on public.pets for insert with check (auth.uid() = owner_id);
create policy "Owners can update pets"
  on public.pets for update using (public.user_is_pet_owner(id));
create policy "Owners can delete pets"
  on public.pets for delete using (public.user_is_pet_owner(id));

-- Pet access
create policy "Users can view pet access for their pets"
  on public.pet_access for select using (
    user_id = auth.uid() or public.user_is_pet_owner(pet_id)
  );
create policy "Owners can manage pet access"
  on public.pet_access for insert with check (public.user_is_pet_owner(pet_id));
create policy "Owners can update pet access"
  on public.pet_access for update using (public.user_is_pet_owner(pet_id) or user_id = auth.uid());
create policy "Owners can delete pet access"
  on public.pet_access for delete using (public.user_is_pet_owner(pet_id));

-- Generic pet-scoped helper macros via repeated policies
create policy "Access conditions" on public.conditions for select using (public.user_has_pet_access(pet_id));
create policy "Write conditions" on public.conditions for insert with check (public.user_can_write_pet(pet_id));
create policy "Update conditions" on public.conditions for update using (public.user_is_pet_owner(pet_id));
create policy "Delete conditions" on public.conditions for delete using (public.user_is_pet_owner(pet_id));

create policy "Access allergies" on public.allergies for select using (public.user_has_pet_access(pet_id));
create policy "Write allergies" on public.allergies for insert with check (public.user_can_write_pet(pet_id));
create policy "Update allergies" on public.allergies for update using (public.user_is_pet_owner(pet_id));
create policy "Delete allergies" on public.allergies for delete using (public.user_is_pet_owner(pet_id));

create policy "Access weights" on public.weight_records for select using (public.user_has_pet_access(pet_id));
create policy "Write weights" on public.weight_records for insert with check (public.user_can_write_pet(pet_id));
create policy "Update weights" on public.weight_records for update using (public.user_can_write_pet(pet_id));
create policy "Delete weights" on public.weight_records for delete using (public.user_is_pet_owner(pet_id));

create policy "Access vaccinations" on public.vaccinations for select using (public.user_has_pet_access(pet_id));
create policy "Write vaccinations" on public.vaccinations for insert with check (public.user_can_write_pet(pet_id));
create policy "Update vaccinations" on public.vaccinations for update using (public.user_can_write_pet(pet_id));
create policy "Delete vaccinations" on public.vaccinations for delete using (public.user_is_pet_owner(pet_id));

create policy "Access medications" on public.medications for select using (public.user_has_pet_access(pet_id));
create policy "Write medications" on public.medications for insert with check (public.user_can_write_pet(pet_id));
create policy "Update medications" on public.medications for update using (public.user_can_write_pet(pet_id));
create policy "Delete medications" on public.medications for delete using (public.user_is_pet_owner(pet_id));

create policy "Access meals" on public.meal_logs for select using (public.user_has_pet_access(pet_id));
create policy "Write meals" on public.meal_logs for insert with check (public.user_can_write_pet(pet_id));
create policy "Update meals" on public.meal_logs for update using (public.user_can_write_pet(pet_id));
create policy "Delete meals" on public.meal_logs for delete using (public.user_is_pet_owner(pet_id));

create policy "Access care tasks" on public.care_tasks for select using (public.user_has_pet_access(pet_id));
create policy "Write care tasks" on public.care_tasks for insert with check (public.user_can_write_pet(pet_id));
create policy "Update care tasks" on public.care_tasks for update using (public.user_can_write_pet(pet_id));
create policy "Delete care tasks" on public.care_tasks for delete using (public.user_is_pet_owner(pet_id));

create policy "Access completions" on public.task_completions for select using (public.user_has_pet_access(pet_id));
create policy "Write completions" on public.task_completions for insert with check (public.user_can_write_pet(pet_id));
create policy "Delete completions" on public.task_completions for delete using (public.user_is_pet_owner(pet_id));

create policy "Access medical records" on public.medical_records for select using (public.user_has_pet_access(pet_id));
create policy "Write medical records" on public.medical_records for insert with check (public.user_can_write_pet(pet_id));
create policy "Update medical records" on public.medical_records for update using (public.user_can_write_pet(pet_id));
create policy "Delete medical records" on public.medical_records for delete using (public.user_is_pet_owner(pet_id));

create policy "Access symptoms" on public.symptoms for select using (public.user_has_pet_access(pet_id));
create policy "Write symptoms" on public.symptoms for insert with check (public.user_can_write_pet(pet_id));
create policy "Update symptoms" on public.symptoms for update using (public.user_can_write_pet(pet_id));
create policy "Delete symptoms" on public.symptoms for delete using (public.user_is_pet_owner(pet_id));

create policy "Users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);
create policy "Users insert own notifications"
  on public.notifications for insert with check (auth.uid() = user_id);
create policy "Users delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

create policy "Access AI conversations"
  on public.ai_conversations for select using (auth.uid() = user_id and public.user_has_pet_access(pet_id));
create policy "Insert AI conversations"
  on public.ai_conversations for insert with check (auth.uid() = user_id and public.user_has_pet_access(pet_id));
create policy "Update AI conversations"
  on public.ai_conversations for update using (auth.uid() = user_id);
create policy "Delete AI conversations"
  on public.ai_conversations for delete using (auth.uid() = user_id);

create policy "Access AI messages"
  on public.ai_messages for select using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy "Insert AI messages"
  on public.ai_messages for insert with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Access own AI usage"
  on public.ai_usage for select using (auth.uid() = user_id);
create policy "Upsert own AI usage"
  on public.ai_usage for insert with check (auth.uid() = user_id);
create policy "Update own AI usage"
  on public.ai_usage for update using (auth.uid() = user_id);

create policy "Users insert analytics"
  on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "Users view own analytics"
  on public.analytics_events for select using (auth.uid() = user_id);

-- Storage buckets (run once; policies below)
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('medical-files', 'medical-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('symptom-photos', 'symptom-photos', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Pet photos are publicly readable"
  on storage.objects for select using (bucket_id = 'pet-photos');
create policy "Authenticated users upload pet photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own pet photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own pet photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Medical files readable by owner path"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'medical-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Medical files upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'medical-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Medical files update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'medical-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Medical files delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'medical-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Symptom photos readable"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'symptom-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Symptom photos upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'symptom-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Symptom photos delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'symptom-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
