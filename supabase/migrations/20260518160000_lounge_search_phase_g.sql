-- Phase G: Lounge server search RPCs (posts + profiles). See supabase/lounge_search_phase_g.sql.

create extension if not exists pg_trgm with schema extensions;

create index if not exists community_feed_posts_search_caption_trgm_idx
  on public.community_feed_posts using gin (lower(caption) extensions.gin_trgm_ops);

create index if not exists community_feed_posts_search_game_trgm_idx
  on public.community_feed_posts using gin (lower(game_title) extensions.gin_trgm_ops);

create index if not exists profiles_search_handle_trgm_idx
  on public.profiles using gin (lower(handle) extensions.gin_trgm_ops);

create index if not exists profiles_search_display_name_trgm_idx
  on public.profiles using gin (lower(display_name) extensions.gin_trgm_ops);

create or replace function public.lounge_normalize_search_term(p_query text)
returns text
language sql
immutable
as $$
  select lower(trim(both from coalesce(p_query, '')));
$$;

create or replace function public.lounge_search_posts(
  p_query text,
  p_limit integer default 40,
  p_offset integer default 0
)
returns table (
  id uuid,
  caption text,
  game_title text,
  game_slug text,
  user_id uuid,
  created_at timestamptz,
  edited_at timestamptz,
  pinned boolean,
  like_count integer,
  comment_count integer,
  repost_count integer,
  repost_of_post_id uuid,
  repost_of_comment_id uuid,
  is_plain_repost boolean,
  media_url text,
  gif_url text,
  image_urls jsonb,
  stream_video_uid text,
  stream_poster_url text,
  stream_video_width integer,
  stream_video_height integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  term text;
  hash_term text;
  lim int;
  off int;
  is_word boolean;
begin
  if auth.uid() is null then
    raise exception 'LOUNGE_SEARCH_AUTH_REQUIRED'
      using message = 'Sign in to search the Lounge.';
  end if;

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  hash_term := term;
  if left(hash_term, 1) = '#' then
    hash_term := substring(hash_term from 2);
  end if;
  is_word := char_length(hash_term) > 0 and position(' ' in hash_term) = 0;
  lim := greatest(1, least(coalesce(p_limit, 40), 80));
  off := greatest(0, coalesce(p_offset, 0));

  return query
  with candidates as (
    select
      c.*,
      case
        when is_word
          and lower(c.caption) ~ (
            '(^|[^[:alnum:]_])#'
            || regexp_replace(hash_term, '([.*+?^${}()|\[\]\\])', '\\\1', 'g')
            || '([^[:alnum:]_]|$)'
          )
          then 0
        when is_word
          and lower(c.caption) ~ (
            '#'
            || regexp_replace(hash_term, '([.*+?^${}()|\[\]\\])', '\\\1', 'g')
            || '[[:alnum:]_]'
          )
          then 1
        else 2
      end as bucket,
      (
        coalesce(c.like_count, 0)
        + coalesce(c.comment_count, 0)
        + coalesce(c.repost_count, 0)
      ) as score
    from public.community_feed_posts c
    left join public.profiles pr on pr.user_id = c.user_id
    where c.hidden_at is null
      and (pr.user_id is null or pr.banned_at is null)
      and (
        lower(c.caption) like '%' || term || '%'
        or lower(c.game_title) like '%' || term || '%'
        or (is_word and lower(c.caption) like '%#' || hash_term || '%')
      )
  )
  select
    candidates.id,
    candidates.caption,
    candidates.game_title,
    candidates.game_slug,
    candidates.user_id,
    candidates.created_at,
    candidates.edited_at,
    candidates.pinned,
    candidates.like_count,
    candidates.comment_count,
    candidates.repost_count,
    candidates.repost_of_post_id,
    candidates.repost_of_comment_id,
    candidates.is_plain_repost,
    candidates.media_url,
    candidates.gif_url,
    candidates.image_urls,
    candidates.stream_video_uid,
    candidates.stream_poster_url,
    candidates.stream_video_width,
    candidates.stream_video_height
  from candidates
  order by candidates.bucket asc, candidates.score desc, candidates.created_at desc
  limit lim
  offset off;
end;
$$;

create or replace function public.lounge_search_profiles(
  p_query text,
  p_limit integer default 20
)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  role text,
  is_og boolean
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  term text;
  handle_term text;
  lim int;
begin
  if auth.uid() is null then
    raise exception 'LOUNGE_SEARCH_AUTH_REQUIRED'
      using message = 'Sign in to search profiles.';
  end if;

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  handle_term := term;
  if left(handle_term, 1) = '@' then
    handle_term := substring(handle_term from 2);
  end if;

  lim := greatest(1, least(coalesce(p_limit, 20), 40));

  return query
  select
    p.user_id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.role,
    coalesce(p.is_og, false)
  from public.profiles p
  where p.banned_at is null
    and (
      lower(p.handle) like '%' || handle_term || '%'
      or lower(p.display_name) like '%' || term || '%'
    )
  order by
    case
      when lower(p.handle) = handle_term then 0
      when lower(p.handle) like handle_term || '%' then 1
      when lower(p.display_name) like term || '%' then 2
      else 3
    end,
    p.display_name asc
  limit lim;
end;
$$;

revoke all on function public.lounge_search_posts(text, integer, integer) from public;
revoke all on function public.lounge_search_profiles(text, integer) from public;
grant execute on function public.lounge_search_posts(text, integer, integer) to authenticated;
grant execute on function public.lounge_search_profiles(text, integer) to authenticated;
