-- offer_casino_names: global shared casino name index used for offer import validation.
-- When the AI extracts a casino name, it is fuzzy-matched against this list.
-- Unrecognized names are routed to the review queue instead of auto-creating.
--
-- Named offer_casino_names to avoid collision with any existing casinos table.
-- All authenticated users can read and add entries (auto-populated on event save).
-- Only admins (profiles.role = 'admin') can update or delete entries.
--
-- Run after offers_schema.sql.

-- Enable trigram extension for fuzzy search (may already be enabled)
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.offer_casino_names (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  aliases     text[]      not null default '{}',
  source      text        not null default 'user_confirmed'
                check (source in ('seed', 'user_confirmed', 'admin')),
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Case-insensitive unique constraint on name
create unique index if not exists offer_casino_names_name_lower_idx
  on public.offer_casino_names (lower(name));

-- GIN index on aliases array
create index if not exists offer_casino_names_aliases_gin_idx
  on public.offer_casino_names using gin (aliases);

-- Trigram index for fuzzy name search
create index if not exists offer_casino_names_name_trgm_idx
  on public.offer_casino_names using gin (name gin_trgm_ops);

alter table public.offer_casino_names enable row level security;

-- All authenticated users can read
drop policy if exists "offer_casino_names_select" on public.offer_casino_names;
create policy "offer_casino_names_select" on public.offer_casino_names
  for select to authenticated using (true);

-- All authenticated users can insert (auto-add when confirming events)
drop policy if exists "offer_casino_names_insert" on public.offer_casino_names;
create policy "offer_casino_names_insert" on public.offer_casino_names
  for insert to authenticated with check (true);

-- Only admins can update
drop policy if exists "offer_casino_names_update" on public.offer_casino_names;
create policy "offer_casino_names_update" on public.offer_casino_names
  for update to authenticated
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- Only admins can delete
drop policy if exists "offer_casino_names_delete" on public.offer_casino_names;
create policy "offer_casino_names_delete" on public.offer_casino_names
  for delete to authenticated
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- ── Helper RPC ───────────────────────────────────────────────────────────────
-- Called by the client after saving any offer event to auto-add the casino name.
-- Uses ON CONFLICT DO NOTHING so duplicate calls are silently ignored.

create or replace function public.upsert_casino_name(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name is null or trim(p_name) = '' then
    return;
  end if;
  insert into public.offer_casino_names (name, source, created_by)
  values (trim(p_name), 'user_confirmed', auth.uid())
  on conflict (lower(name)) do nothing;
end;
$$;

-- Allow authenticated users to call the RPC
grant execute on function public.upsert_casino_name(text) to authenticated;

-- ── Seed from existing offer_events ─────────────────────────────────────────
-- Inserts every distinct non-empty casino_name already in offer_events as a
-- 'user_confirmed' entry. Skips any that conflict on name (case-insensitive).
-- Safe to re-run.

insert into public.offer_casino_names (name, source)
select distinct trim(casino_name), 'user_confirmed'
from public.offer_events
where casino_name is not null
  and trim(casino_name) <> ''
on conflict (lower(name)) do nothing;
