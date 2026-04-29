-- Offer mailer / screenshot uploads (Phase 2 — AI parsing hooks)
-- Run after offers_schema.sql

create table if not exists public.offer_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null default 'offer-mailers',
  storage_path text not null,
  file_name text,
  mime_type text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'queued', 'parsing', 'parsed', 'failed')),
  parse_error text,
  created_at timestamptz not null default now()
);

create index if not exists offer_uploads_user_created_idx
  on public.offer_uploads (user_id, created_at desc);

alter table public.offer_uploads enable row level security;

drop policy if exists "offer_uploads_select_own" on public.offer_uploads;
create policy "offer_uploads_select_own" on public.offer_uploads
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "offer_uploads_insert_own" on public.offer_uploads;
create policy "offer_uploads_insert_own" on public.offer_uploads
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "offer_uploads_update_own" on public.offer_uploads;
create policy "offer_uploads_update_own" on public.offer_uploads
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "offer_uploads_delete_own" on public.offer_uploads;
create policy "offer_uploads_delete_own" on public.offer_uploads
  for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_offer_uploads_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_offer_uploads_user_id on public.offer_uploads;
create trigger trg_set_offer_uploads_user_id
before insert on public.offer_uploads
for each row
execute function public.set_offer_uploads_user_id();
