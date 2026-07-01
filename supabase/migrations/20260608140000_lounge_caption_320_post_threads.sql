-- Lounge caption/comment cap 320 chars + optional multi-post threads (continuations link to root).

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_caption_len_check;

alter table public.community_feed_posts
  add constraint community_feed_posts_caption_len_check
  check (char_length(caption) <= 320);

comment on column public.community_feed_posts.caption is 'Canonical feed caption (<= 320 chars).';

alter table public.feed_comments
  drop constraint if exists feed_comments_body_len;

alter table public.feed_comments
  add constraint feed_comments_body_len
  check (char_length(body) >= 1 and char_length(body) <= 320);

alter table public.lounge_post_drafts
  drop constraint if exists lounge_post_drafts_caption_len;

alter table public.lounge_post_drafts
  add constraint lounge_post_drafts_caption_len
  check (char_length(caption) <= 320);

-- Thread continuations: part 0 is the feed-visible root (thread_root_id null).
alter table public.community_feed_posts
  add column if not exists thread_root_id uuid references public.community_feed_posts (id) on delete cascade;

alter table public.community_feed_posts
  add column if not exists thread_part_index smallint not null default 0;

alter table public.community_feed_posts
  add column if not exists thread_part_count smallint not null default 1;

comment on column public.community_feed_posts.thread_root_id is
  'When set, this row is a thread continuation; points at the root post id. Null on standalone and thread roots.';
comment on column public.community_feed_posts.thread_part_index is
  '0 = standalone or thread root (feed-visible). 1+ = continuation parts.';
comment on column public.community_feed_posts.thread_part_count is
  'Total parts in thread (including root). Maintained on root only; 1 for standalone posts.';

create index if not exists community_feed_posts_thread_root_idx
  on public.community_feed_posts (thread_root_id, thread_part_index)
  where thread_root_id is not null;

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_thread_shape_check;

alter table public.community_feed_posts
  add constraint community_feed_posts_thread_shape_check
  check (
    (thread_root_id is null and thread_part_index = 0)
    or (thread_root_id is not null and thread_part_index > 0)
  );

-- Feed page: hide thread continuations (only roots / standalone in timeline).
drop function if exists public.lounge_feed_posts_page(text, uuid[], integer, timestamptz, timestamptz, uuid, numeric, text[]);

create function public.lounge_feed_posts_page(
  p_sort text default 'latest',
  p_following_user_ids uuid[] default null,
  p_limit integer default 29,
  p_as_of timestamptz default now(),
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_cursor_popular_score numeric default null,
  p_excluded_category_slugs text[] default null
)
returns setof public.community_feed_posts
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  lim integer;
  sort_popular boolean;
  excluded_slugs text[];
  has_exclusion_filter boolean;
begin
  lim := greatest(1, least(coalesce(p_limit, 29), 60));
  sort_popular := lower(coalesce(p_sort, 'latest')) = 'popular';
  excluded_slugs := coalesce(p_excluded_category_slugs, '{}'::text[]);
  if cardinality(excluded_slugs) > 0 then
    excluded_slugs := (
      select coalesce(array_agg(distinct s), '{}'::text[])
      from unnest(excluded_slugs) as s
      where s = any(public.lounge_allowed_category_slugs())
    );
  end if;
  has_exclusion_filter := cardinality(excluded_slugs) > 0;

  return query
  select c.*
  from public.community_feed_posts c
  left join public.profiles pr on pr.user_id = c.user_id
  where c.hidden_at is null
    and c.pinned = false
    and c.thread_root_id is null
    and (pr.user_id is null or pr.banned_at is null)
    and (
      p_following_user_ids is null
      or c.user_id = any(p_following_user_ids)
    )
    and (
      not has_exclusion_filter
      or cardinality(coalesce(c.category_pills, '{}'::text[])) = 0
      or not (coalesce(c.category_pills, '{}'::text[]) <@ excluded_slugs)
    )
    and (
      (
        not sort_popular
        and (
          p_cursor_created_at is null
          or c.created_at < p_cursor_created_at
          or (c.created_at = p_cursor_created_at and c.id < p_cursor_id)
        )
      )
      or (
        sort_popular
        and (
          p_cursor_popular_score is null
          or public.lounge_feed_popular_score(
            c.like_count, c.comment_count, c.repost_count, c.created_at, p_as_of
          ) < p_cursor_popular_score
          or (
            public.lounge_feed_popular_score(
              c.like_count, c.comment_count, c.repost_count, c.created_at, p_as_of
            ) = p_cursor_popular_score
            and c.id < p_cursor_id
          )
        )
      )
    )
  order by
    case
      when sort_popular then public.lounge_feed_popular_score(
        c.like_count, c.comment_count, c.repost_count, c.created_at, p_as_of
      )
    end desc nulls last,
    case when not sort_popular then c.created_at end desc nulls last,
    c.id desc
  limit lim;
end;
$$;

grant execute on function public.lounge_feed_posts_page(
  text, uuid[], integer, timestamptz, timestamptz, uuid, numeric, text[]
) to anon, authenticated;

-- Thread parts for post detail (root + continuations, ordered).
create or replace function public.lounge_post_thread_parts(p_root_id uuid)
returns setof public.community_feed_posts
language sql
stable
security invoker
set search_path = public
as $$
  select c.*
  from public.community_feed_posts c
  where c.hidden_at is null
    and (
      c.id = p_root_id
      or c.thread_root_id = p_root_id
    )
  order by c.thread_part_index asc, c.created_at asc, c.id asc;
$$;

grant execute on function public.lounge_post_thread_parts(uuid) to anon, authenticated;
