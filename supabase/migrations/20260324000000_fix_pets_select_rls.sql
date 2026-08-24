-- Fix care plan / pet creation: INSERT ... RETURNING failed because the only
-- SELECT policy used user_has_pet_access(), which queries pets in a subquery
-- before the AFTER INSERT trigger adds pet_access. During RETURNING the new
-- row is not visible to that subquery yet.
--
-- Add a direct owner check so owners can always read (and RETURN) their pets.

create policy "Owners can view own pets"
  on public.pets for select
  to authenticated
  using (auth.uid() = owner_id);
