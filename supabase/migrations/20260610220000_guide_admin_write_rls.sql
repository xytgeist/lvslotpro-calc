-- Admin INSERT/UPDATE (+ read unpublished guides) for slot-guide-form Save and ingest tooling.
-- DELETE policies: 20260610180000_guide_admin_delete_rls.sql
-- Canonical copy: supabase/guide_admin_rls.sql (keep in sync)

-- ── machines: admin insert + update ──────────────────────────────────────────

drop policy if exists "Admins can insert machines" on public.machines;
create policy "Admins can insert machines" on public.machines
  for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can update machines" on public.machines;
create policy "Admins can update machines" on public.machines
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- ── guides: admin full read + insert + update ─────────────────────────────────

drop policy if exists "Admins can read all guides" on public.guides;
create policy "Admins can read all guides" on public.guides
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can insert guides" on public.guides;
create policy "Admins can insert guides" on public.guides
  for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can update guides" on public.guides;
create policy "Admins can update guides" on public.guides
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

grant select, insert, update, delete on public.machines to authenticated;
grant select, insert, update, delete on public.guides to authenticated;
