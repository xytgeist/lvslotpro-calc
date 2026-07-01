-- Per-comment likes / reposts / bookmarks (denormalized counts on feed_comments).
-- Apply on test (then prod) after feed_comments exists.

alter table public.feed_comments
  add column if not exists like_count integer not null default 0,
  add column if not exists repost_count integer not null default 0,
  add column if not exists bookmark_count integer not null default 0;

comment on column public.feed_comments.like_count is 'Denormalized; maintained by triggers on public.feed_comment_likes.';
comment on column public.feed_comments.repost_count is 'Denormalized; maintained by triggers on public.feed_comment_reposts.';
comment on column public.feed_comments.bookmark_count is 'Denormalized; maintained by triggers on public.feed_comment_bookmarks.';

-- ---------------------------------------------------------------------------
-- feed_comment_likes
-- ---------------------------------------------------------------------------
create table if not exists public.feed_comment_likes (
  comment_id uuid not null references public.feed_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint feed_comment_likes_pk primary key (comment_id, user_id)
);

create index if not exists feed_comment_likes_user_idx on public.feed_comment_likes (user_id);

alter table public.feed_comment_likes enable row level security;

drop policy if exists feed_comment_likes_select_own on public.feed_comment_likes;
create policy feed_comment_likes_select_own on public.feed_comment_likes
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists feed_comment_likes_insert_own on public.feed_comment_likes;
create policy feed_comment_likes_insert_own on public.feed_comment_likes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feed_comments c
      where c.id = comment_id and c.hidden_at is null
    )
  );

drop policy if exists feed_comment_likes_delete_own on public.feed_comment_likes;
create policy feed_comment_likes_delete_own on public.feed_comment_likes
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.feed_comment_likes to authenticated;

-- ---------------------------------------------------------------------------
-- feed_comment_reposts
-- ---------------------------------------------------------------------------
create table if not exists public.feed_comment_reposts (
  comment_id uuid not null references public.feed_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint feed_comment_reposts_pk primary key (comment_id, user_id)
);

create index if not exists feed_comment_reposts_user_idx on public.feed_comment_reposts (user_id);

alter table public.feed_comment_reposts enable row level security;

drop policy if exists feed_comment_reposts_select_own on public.feed_comment_reposts;
create policy feed_comment_reposts_select_own on public.feed_comment_reposts
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists feed_comment_reposts_insert_own on public.feed_comment_reposts;
create policy feed_comment_reposts_insert_own on public.feed_comment_reposts
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feed_comments c
      where c.id = comment_id and c.hidden_at is null
    )
  );

drop policy if exists feed_comment_reposts_delete_own on public.feed_comment_reposts;
create policy feed_comment_reposts_delete_own on public.feed_comment_reposts
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.feed_comment_reposts to authenticated;

-- ---------------------------------------------------------------------------
-- feed_comment_bookmarks
-- ---------------------------------------------------------------------------
create table if not exists public.feed_comment_bookmarks (
  comment_id uuid not null references public.feed_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint feed_comment_bookmarks_pk primary key (comment_id, user_id)
);

create index if not exists feed_comment_bookmarks_user_idx on public.feed_comment_bookmarks (user_id);

alter table public.feed_comment_bookmarks enable row level security;

drop policy if exists feed_comment_bookmarks_select_own on public.feed_comment_bookmarks;
create policy feed_comment_bookmarks_select_own on public.feed_comment_bookmarks
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists feed_comment_bookmarks_insert_own on public.feed_comment_bookmarks;
create policy feed_comment_bookmarks_insert_own on public.feed_comment_bookmarks
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feed_comments c
      where c.id = comment_id and c.hidden_at is null
    )
  );

drop policy if exists feed_comment_bookmarks_delete_own on public.feed_comment_bookmarks;
create policy feed_comment_bookmarks_delete_own on public.feed_comment_bookmarks
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.feed_comment_bookmarks to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers: maintain counts on feed_comments
-- ---------------------------------------------------------------------------
create or replace function public.feed_comment_likes_touch_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_comments
      set like_count = like_count + 1
      where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.feed_comments
      set like_count = greatest(0, like_count - 1)
      where id = old.comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_feed_comment_likes_touch on public.feed_comment_likes;
create trigger trg_feed_comment_likes_touch
  after insert or delete on public.feed_comment_likes
  for each row
  execute function public.feed_comment_likes_touch_count();

create or replace function public.feed_comment_reposts_touch_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_comments
      set repost_count = repost_count + 1
      where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.feed_comments
      set repost_count = greatest(0, repost_count - 1)
      where id = old.comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_feed_comment_reposts_touch on public.feed_comment_reposts;
create trigger trg_feed_comment_reposts_touch
  after insert or delete on public.feed_comment_reposts
  for each row
  execute function public.feed_comment_reposts_touch_count();

create or replace function public.feed_comment_bookmarks_touch_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_comments
      set bookmark_count = bookmark_count + 1
      where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.feed_comments
      set bookmark_count = greatest(0, bookmark_count - 1)
      where id = old.comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_feed_comment_bookmarks_touch on public.feed_comment_bookmarks;
create trigger trg_feed_comment_bookmarks_touch
  after insert or delete on public.feed_comment_bookmarks
  for each row
  execute function public.feed_comment_bookmarks_touch_count();
