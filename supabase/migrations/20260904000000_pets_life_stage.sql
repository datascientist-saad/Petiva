-- Add explicit life-stage support for unknown-age pets.
-- Safe for existing rows: new column is nullable and does not rewrite birth dates.
--
-- Production (tqfxsxwqxidcsmlstbjf) is missing this column. Until it is applied,
-- every pet insert that sends life_stage fails with:
--   column pets.life_stage does not exist
-- Paste this file into the Supabase SQL editor if the dashboard shows no
-- migration history (SQL applied by hand is not recorded there).

alter table public.pets
  add column if not exists life_stage text;

alter table public.pets drop constraint if exists pets_life_stage_check;
alter table public.pets add constraint pets_life_stage_check
  check (life_stage is null or life_stage in ('baby', 'young', 'adult', 'senior', 'unknown'));

comment on column public.pets.life_stage is
  'Approximate life stage when date of birth is unknown. Never invent a birth date from this value.';

-- Existing records with no birth date and no estimated age are unknown, not puppies/kittens.
update public.pets
set life_stage = 'unknown'
where birth_date is null
  and (estimated_age_months is null or estimated_age_months = 0)
  and life_stage is null;
