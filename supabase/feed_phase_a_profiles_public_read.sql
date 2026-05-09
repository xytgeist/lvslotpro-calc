-- Phase A — Social feed foundation: profiles + post moderation columns + public read for anon.
-- Apply in Supabase SQL editor AFTER `community_feed_posts.sql` (or merge into a fresh env).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where appropriate.

-- ---------------------------------------------------------------------------
-- 1) Profiles (handles, avatar, moderation role, bans)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  display_name text not null default '',
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_chars check (
    handle ~ '^[a-z0-9_]{2,30}$'
  ),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 160)
);

create unique index if not exists profiles_handle_lower_key on public.profiles (lower(handle));

alter table public.profiles enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select to anon, authenticated
  using (banned_at is null);

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles mp
      where mp.user_id = auth.uid()
        and mp.role in ('moderator', 'admin')
    )
  );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = user_id and role = 'user');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.profiles is
  'Public identity for Slot Pro feed; handle unique case-insensitive (stored lowercase).';

-- Only admins may change role (e.g. promote moderator) — set your first admin via SQL.
create or replace function public.profiles_enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    ) then
      raise exception 'Role change requires admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_enforce_role on public.profiles;
create trigger trg_profiles_enforce_role
  before update on public.profiles
  for each row
  execute function public.profiles_enforce_role_change();

-- Authors may only edit content-ish columns; staff may edit moderation / pin / counts.
create or replace function public.community_feed_posts_author_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('moderator', 'admin')
  )
  into staff;

  if staff then
    return new;
  end if;

  if auth.uid() is not null and auth.uid() = old.user_id then
    if new.hidden_at is distinct from old.hidden_at
      or new.hidden_reason is distinct from old.hidden_reason
      or new.needs_mod_review is distinct from old.needs_mod_review
      or new.pinned is distinct from old.pinned
      or new.like_count is distinct from old.like_count
      or new.comment_count is distinct from old.comment_count
      or new.user_id is distinct from old.user_id
    then
      raise exception 'Not allowed to change moderation or engagement fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_community_feed_posts_author_guard on public.community_feed_posts;
create trigger trg_community_feed_posts_author_guard
  before update on public.community_feed_posts
  for each row
  execute function public.community_feed_posts_author_guard();

-- ---------------------------------------------------------------------------
-- 2) Extend community_feed_posts
-- ---------------------------------------------------------------------------
alter table public.community_feed_posts
  add column if not exists edited_at timestamptz;

alter table public.community_feed_posts
  add column if not exists hidden_at timestamptz;

alter table public.community_feed_posts
  add column if not exists hidden_reason text;

alter table public.community_feed_posts
  add column if not exists needs_mod_review boolean not null default false;

alter table public.community_feed_posts
  add column if not exists pinned boolean not null default false;

alter table public.community_feed_posts
  add column if not exists like_count integer not null default 0;

alter table public.community_feed_posts
  add column if not exists comment_count integer not null default 0;

comment on column public.community_feed_posts.hidden_at is 'When set, post is withheld from public feed (moderation).';
comment on column public.community_feed_posts.pinned is 'At most one visible pinned row enforced by partial unique index below.';

-- At most one globally pinned post among non-hidden rows.
create unique index if not exists community_feed_single_pinned_idx
  on public.community_feed_posts ((1))
  where pinned = true and hidden_at is null;

-- ---------------------------------------------------------------------------
-- 3) RLS — community_feed_posts (public read, authed write)
-- ---------------------------------------------------------------------------
alter table public.community_feed_posts enable row level security;

drop policy if exists community_feed_posts_select_authed on public.community_feed_posts;
drop policy if exists community_feed_posts_insert_own on public.community_feed_posts;
drop policy if exists community_feed_posts_update_own on public.community_feed_posts;
drop policy if exists community_feed_posts_delete_own on public.community_feed_posts;

drop policy if exists community_feed_posts_select_public on public.community_feed_posts;
create policy community_feed_posts_select_public on public.community_feed_posts
  for select to anon, authenticated
  using (hidden_at is null);

drop policy if exists community_feed_posts_insert_authed on public.community_feed_posts;
create policy community_feed_posts_insert_authed on public.community_feed_posts
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.banned_at is not null
    )
  );

drop policy if exists community_feed_posts_update_author on public.community_feed_posts;
create policy community_feed_posts_update_author on public.community_feed_posts
  for update to authenticated
  using (
    auth.uid() = user_id
    and created_at >= (now() - interval '30 minutes')
  )
  with check (auth.uid() = user_id);

drop policy if exists community_feed_posts_update_moderator on public.community_feed_posts;
create policy community_feed_posts_update_moderator on public.community_feed_posts
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('moderator', 'admin')
    )
  )
  with check (true);

drop policy if exists community_feed_posts_delete_author on public.community_feed_posts;
create policy community_feed_posts_delete_author on public.community_feed_posts
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists community_feed_posts_delete_moderator on public.community_feed_posts;
create policy community_feed_posts_delete_moderator on public.community_feed_posts
  for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );
