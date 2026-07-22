-- Hotfix 42804: expand composite from lounge_feed_post_mask_for_viewer when returning SETOF community_feed_posts.

begin;

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
security definer
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
  select (public.lounge_feed_post_mask_for_viewer(c.*)).*
  from public.community_feed_posts c
  left join public.profiles pr on pr.user_id = c.user_id
  where c.hidden_at is null
    and c.pinned = false
    and c.thread_root_id is null
    and (pr.user_id is null or pr.banned_at is null)
    and (
      not coalesce(c.subscriber_only, false)
      or public.lounge_viewer_is_subscriber_or_staff()
    )
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

create or replace function public.lounge_feed_pinned_for_viewer(
  p_following_user_ids uuid[] default null,
  p_excluded_category_slugs text[] default null
)
returns setof public.community_feed_posts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  excluded_slugs text[];
  has_exclusion_filter boolean;
begin
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
  select (public.lounge_feed_post_mask_for_viewer(c.*)).*
  from public.community_feed_posts c
  left join public.profiles pr on pr.user_id = c.user_id
  where c.hidden_at is null
    and c.pinned = true
    and c.thread_root_id is null
    and (pr.user_id is null or pr.banned_at is null)
    and (
      not coalesce(c.subscriber_only, false)
      or public.lounge_viewer_is_subscriber_or_staff()
    )
    and (
      p_following_user_ids is null
      or c.user_id = any(p_following_user_ids)
    )
    and (
      not has_exclusion_filter
      or cardinality(coalesce(c.category_pills, '{}'::text[])) = 0
      or not (coalesce(c.category_pills, '{}'::text[]) <@ excluded_slugs)
    )
  order by c.created_at desc, c.id desc
  limit 2;
end;
$$;

create or replace function public.lounge_community_feed_posts_for_viewer(p_post_ids uuid[])
returns setof public.community_feed_posts
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_post_ids is null or cardinality(p_post_ids) = 0 then
    return;
  end if;

  return query
  select (public.lounge_feed_post_mask_for_viewer(c.*)).*
  from public.community_feed_posts c
  where c.id = any(p_post_ids)
    and c.hidden_at is null
    and (
      not coalesce(c.subscriber_only, false)
      or public.lounge_viewer_is_subscriber_or_staff()
    );
end;
$$;

create or replace function public.lounge_profile_feed_posts_for_viewer(
  p_profile_user_id uuid,
  p_limit integer default 10,
  p_offset integer default 0
)
returns setof public.community_feed_posts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer;
  off integer;
begin
  if p_profile_user_id is null then
    return;
  end if;
  lim := greatest(0, least(coalesce(p_limit, 10), 60));
  off := greatest(0, coalesce(p_offset, 0));
  if lim = 0 then
    return;
  end if;

  return query
  select (public.lounge_feed_post_mask_for_viewer(c.*)).*
  from public.community_feed_posts c
  where c.user_id = p_profile_user_id
    and c.hidden_at is null
    and c.thread_root_id is null
    and (
      not coalesce(c.subscriber_only, false)
      or public.lounge_viewer_is_subscriber_or_staff()
    )
  order by
    c.profile_pinned_at desc nulls last,
    c.created_at desc,
    c.id desc
  offset off
  limit lim;
end;
$$;

commit;
