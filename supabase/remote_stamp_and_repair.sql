-- One-paste repair for a hosted Animivo project whose Dashboard → Database →
-- Migrations list is empty.
--
-- Why the list is empty: SQL was applied in the editor (or an older dump),
-- which does not create supabase_migrations.schema_migrations. The CLI and
-- dashboard only show rows in that table.
--
-- This script:
--   1. Creates the CLI history table if it is missing
--   2. Applies the two changes production is actually missing
--      (pets.life_stage + bird-safe species/weight/sex checks)
--   3. Records every file in supabase/migrations as already applied
--
-- Safe to run more than once. Paste the whole file into the Supabase SQL editor
-- and click Run. After that, Database → Migrations should list six versions.
--
-- Later deploys: npx supabase login && npx supabase link --project-ref tqfxsxwqxidcsmlstbjf
-- then npx supabase db push

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text
);

alter table supabase_migrations.schema_migrations
  add column if not exists statements text[],
  add column if not exists name text;

-- ---------------------------------------------------------------------------
-- Pending schema (not present on tqfxsxwqxidcsmlstbjf as of 2026-09-04)
-- ---------------------------------------------------------------------------

alter table public.pets
  add column if not exists life_stage text;

alter table public.pets drop constraint if exists pets_life_stage_check;
alter table public.pets add constraint pets_life_stage_check
  check (life_stage is null or life_stage in ('baby', 'young', 'adult', 'senior', 'unknown'));

comment on column public.pets.life_stage is
  'Approximate life stage when date of birth is unknown. Never invent a birth date from this value.';

update public.pets
set life_stage = 'unknown'
where birth_date is null
  and (estimated_age_months is null or estimated_age_months = 0)
  and life_stage is null;

do $$
declare
  rec record;
begin
  for rec in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'pets'
      and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ilike '%weight_unit%'
        or pg_get_constraintdef(c.oid) ilike '%species%'
        or pg_get_constraintdef(c.oid) ilike '%sex%'
      )
  loop
    execute format('alter table public.pets drop constraint if exists %I', rec.conname);
  end loop;
end $$;

alter table public.pets add constraint pets_weight_unit_check
  check (weight_unit in ('kg', 'lb', 'g'));

alter table public.pets add constraint pets_species_check
  check (species in ('cat', 'dog', 'bird', 'rabbit', 'guinea_pig', 'hamster', 'reptile', 'fish', 'other'));

alter table public.pets add constraint pets_sex_check
  check (sex is null or sex in ('male', 'female', 'unknown'));

alter table public.pets
  alter column weight_kg type numeric(10,4);

alter table public.weight_records
  alter column weight_kg type numeric(10,4);

-- ---------------------------------------------------------------------------
-- Record local migration files so the dashboard / CLI see a matching history
-- ---------------------------------------------------------------------------

insert into supabase_migrations.schema_migrations (version, name, statements)
values
  ('20260323000000', 'pawly_init', '{}'),
  ('20260324000000', 'fix_pets_select_rls', '{}'),
  ('20260829000000', 'diet_plans_and_nutrition', '{}'),
  ('20260831000000', 'animivo_expansion', '{}'),
  ('20260904000000', 'pets_life_stage', '{}'),
  ('20260904120000', 'fix_bird_weight_unit', '{}')
on conflict (version) do update
set name = excluded.name;
