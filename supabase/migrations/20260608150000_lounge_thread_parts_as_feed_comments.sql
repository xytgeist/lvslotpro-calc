-- Thread continuations (parts 2+) live on feed_comments with full comment interactions.
-- Root post keeps thread_part_count for feed badge; continuation rows are no longer community_feed_posts.

alter table public.feed_comments
  add column if not exists is_thread_part boolean not null default false;

alter table public.feed_comments
  add column if not exists thread_part_index smallint;

comment on column public.feed_comments.is_thread_part is
  'True for author-authored thread continuation sections (part 2+). Root-level only; excluded from post comment_count.';
comment on column public.feed_comments.thread_part_index is
  '1-based index within the post thread when is_thread_part; null otherwise.';

alter table public.feed_comments
  drop constraint if exists feed_comments_thread_part_shape_check;

alter table public.feed_comments
  add constraint feed_comments_thread_part_shape_check
  check (
    (not is_thread_part and thread_part_index is null)
    or (is_thread_part and thread_part_index > 0 and parent_id is null)
  );

create unique index if not exists feed_comments_thread_part_unique_idx
  on public.feed_comments (post_id, thread_part_index)
  where is_thread_part and hidden_at is null;

-- Migrate legacy continuation posts (if any) into feed_comments, then remove them.
insert into public.feed_comments (
  post_id,
  user_id,
  body,
  created_at,
  edited_at,
  link_preview,
  is_thread_part,
  thread_part_index
)
select
  c.thread_root_id,
  c.user_id,
  c.caption,
  c.created_at,
  c.edited_at,
  c.link_preview,
  true,
  c.thread_part_index
from public.community_feed_posts c
where c.thread_root_id is not null
  and c.hidden_at is null
  and not exists (
    select 1
    from public.feed_comments fc
    where fc.post_id = c.thread_root_id
      and fc.is_thread_part
      and fc.thread_part_index = c.thread_part_index
      and fc.hidden_at is null
  );

delete from public.community_feed_posts
where thread_root_id is not null;

-- Post comment_count: exclude thread parts (they are post body, not user replies).
update public.community_feed_posts p
set comment_count = coalesce(
  (
    select count(*)::integer
    from public.feed_comments fc
    where fc.post_id = p.id
      and fc.hidden_at is null
      and not fc.is_thread_part
  ),
  0
);

create or replace function public.feed_comments_guard_thread_part_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_thread_part then
    if new.parent_id is not null then
      raise exception 'feed_comments: thread parts must be root-level (parent_id null)';
    end if;
    if not exists (
      select 1
      from public.community_feed_posts p
      where p.id = new.post_id
        and p.user_id = new.user_id
        and p.hidden_at is null
    ) then
      raise exception 'feed_comments: only the post author can add thread parts';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_comments_thread_part_insert on public.feed_comments;
create trigger trg_feed_comments_thread_part_insert
  before insert on public.feed_comments
  for each row
  execute function public.feed_comments_guard_thread_part_insert();

create or replace function public.feed_comments_guard_identity_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.post_id is distinct from old.post_id
     or new.user_id is distinct from old.user_id
     or new.parent_id is distinct from old.parent_id
     or new.created_at is distinct from old.created_at
     or new.is_thread_part is distinct from old.is_thread_part
     or new.thread_part_index is distinct from old.thread_part_index
  then
    raise exception 'feed_comments: cannot change post_id, user_id, parent_id, created_at, is_thread_part, or thread_part_index';
  end if;
  return new;
end;
$$;

create or replace function public.feed_comments_touch_post_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.hidden_at is null and not coalesce(new.is_thread_part, false) then
      perform public.feed_comments_bump_ancestor_counts(new.post_id, new.parent_id, 1);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.hidden_at is null and not coalesce(old.is_thread_part, false) then
      perform public.feed_comments_bump_ancestor_counts(old.post_id, old.parent_id, -1);
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.hidden_at is null and new.hidden_at is not null and not coalesce(old.is_thread_part, false) then
      perform public.feed_comments_bump_ancestor_counts(old.post_id, old.parent_id, -1);
    elsif old.hidden_at is not null and new.hidden_at is null and not coalesce(new.is_thread_part, false) then
      perform public.feed_comments_bump_ancestor_counts(new.post_id, new.parent_id, 1);
    end if;
    return new;
  end if;
  return null;
exception when others then
  perform set_config('lounge.denorm_feed_counters', '', true);
  raise;
end;
$$;

-- Thread parts for post detail (ordered continuation comments).
-- 140000 created this RPC returning community_feed_posts; return type must drop before recreate.
drop function if exists public.lounge_post_thread_parts(uuid);

create function public.lounge_post_thread_parts(p_root_id uuid)
returns setof public.feed_comments
language sql
stable
security invoker
set search_path = public
as $$
  select fc.*
  from public.feed_comments fc
  where fc.hidden_at is null
    and fc.post_id = p_root_id
    and fc.is_thread_part
  order by fc.thread_part_index asc, fc.created_at asc, fc.id asc;
$$;

grant execute on function public.lounge_post_thread_parts(uuid) to anon, authenticated;
