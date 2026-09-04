-- Repair leftover pets checks that reject bird profiles.
-- The original inline weight_unit check allowed only kg/lb. If that constraint
-- was not dropped (different generated name), bird profiles with weight_unit = 'g'
-- fail. The original species check allowed only cat/dog.

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

-- Small birds are stored in kilograms as 0.005–0.35; numeric(8,2) rounded those to 0.
alter table public.pets
  alter column weight_kg type numeric(10,4);

alter table public.weight_records
  alter column weight_kg type numeric(10,4);
