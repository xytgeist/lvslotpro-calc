-- Search hardening: 128-char cap, strpos (no LIKE wildcards), 5s statement_timeout per RPC.
-- See supabase/lounge_search_phase_g.sql.

create or replace function public.lounge_normalize_search_term(p_query text)
returns text
language sql
immutable
as $$
  select left(lower(trim(both from coalesce(p_query, ''))), 128);
$$;

comment on function public.lounge_normalize_search_term(text) is
  'Trim, lower-case, and cap Lounge search input at 128 chars.';

create or replace function public.lounge_search_posts(
  p_query text,
  p_limit integer default 40,
  p_offset integer default 0,
  p_sort text default 'engagement'
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
  handle_term text;
  lim int;
  off int;
  is_word boolean;
  is_handle_query boolean;
  sort_recent boolean;
begin
  perform public.lounge_search_enforce_rate_limit();
  perform set_config('statement_timeout', '5000', true);

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  is_handle_query := left(term, 1) = '@';
  handle_term := term;
  if left(handle_term, 1) = '@' then
    handle_term := substring(handle_term from 2);
  end if;
  if is_handle_query and char_length(handle_term) < 2 then
    return;
  end if;

  hash_term := term;
  if left(hash_term, 1) = '#' then
    hash_term := substring(hash_term from 2);
  elsif left(hash_term, 1) = '@' then
    hash_term := substring(hash_term from 2);
  end if;
  is_word := char_length(hash_term) > 0 and position(' ' in hash_term) = 0;
  lim := greatest(1, least(coalesce(p_limit, 40), 80));
  off := greatest(0, coalesce(p_offset, 0));
  sort_recent := lower(coalesce(p_sort, 'engagement')) = 'recent';

  return query
  with candidates as (
    select
      c.*,
      case
        when is_handle_query then 0
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
      ) as score,
      greatest(
        extensions.similarity(lower(coalesce(c.caption, '')), case when is_handle_query then handle_term else term end),
        extensions.similarity(lower(coalesce(c.game_title, '')), case when is_handle_query then handle_term else term end)
      ) as sim_score
    from public.community_feed_posts c
    left join public.profiles pr on pr.user_id = c.user_id
    where c.hidden_at is null
      and (pr.user_id is null or pr.banned_at is null)
      and (
        case
          when is_handle_query then (
            exists (
              select 1
              from public.profiles ap
              where ap.user_id = c.user_id
                and ap.banned_at is null
                and (
                  strpos(lower(ap.handle), handle_term) > 0
                  or extensions.similarity(lower(ap.handle), handle_term) > 0.15
                )
            )
            or lower(c.caption) ~ (
              '(^|[^[:alnum:]_])@'
              || regexp_replace(handle_term, '([.*+?^${}()|\[\]\\])', '\\\1', 'g')
              || '([^[:alnum:]_]|$)'
            )
          )
          else (
            strpos(lower(coalesce(c.caption, '')), term) > 0
            or strpos(lower(coalesce(c.game_title, '')), term) > 0
            or extensions.similarity(lower(coalesce(c.caption, '')), term) > 0.15
            or extensions.similarity(lower(coalesce(c.game_title, '')), term) > 0.15
            or (is_word and strpos(lower(coalesce(c.caption, '')), '#' || hash_term) > 0)
          )
        end
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
  order by
    candidates.bucket asc,
    case when sort_recent then candidates.created_at end desc nulls last,
    case when not sort_recent then candidates.score end desc nulls last,
    candidates.sim_score desc,
    case when sort_recent then candidates.score end desc nulls last,
    candidates.created_at desc
  limit lim
  offset off;
end;
$$;

create or replace function public.lounge_search_profiles(
  p_query text,
  p_limit integer default 20,
  p_sort text default 'engagement'
)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  role text,
  is_og boolean,
  about_me text
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
  is_handle_query boolean;
begin
  perform public.lounge_search_enforce_rate_limit();
  perform set_config('statement_timeout', '5000', true);

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  is_handle_query := left(term, 1) = '@';
  handle_term := term;
  if left(handle_term, 1) = '@' then
    handle_term := substring(handle_term from 2);
  end if;
  if is_handle_query and char_length(handle_term) < 2 then
    return;
  end if;

  lim := greatest(1, least(coalesce(p_limit, 20), 40));

  return query
  select
    p.user_id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.role,
    coalesce(p.is_og, false),
    p.about_me
  from public.profiles p
  where p.banned_at is null
    and (
      case
        when is_handle_query then (
          strpos(lower(p.handle), handle_term) > 0
          or extensions.similarity(lower(p.handle), handle_term) > 0.15
        )
        else (
          strpos(lower(p.handle), handle_term) > 0
          or strpos(lower(coalesce(p.display_name, '')), term) > 0
          or extensions.similarity(lower(p.handle), handle_term) > 0.15
          or extensions.similarity(lower(coalesce(p.display_name, '')), term) > 0.15
        )
      end
    )
  order by
    case
      when is_handle_query and lower(p.handle) = handle_term then 0
      when is_handle_query and starts_with(lower(p.handle), handle_term) then 1
      when not is_handle_query and lower(p.handle) = handle_term then 0
      when not is_handle_query and starts_with(lower(p.handle), handle_term) then 1
      when not is_handle_query and starts_with(lower(coalesce(p.display_name, '')), term) then 2
      else 3
    end,
    extensions.similarity(lower(p.handle), handle_term) desc,
    extensions.similarity(lower(coalesce(p.display_name, '')), term) desc,
    p.display_name asc
  limit lim;
end;
$$;

create or replace function public.lounge_search_comments(
  p_query text,
  p_limit integer default 30,
  p_offset integer default 0,
  p_sort text default 'engagement'
)
returns table (
  id uuid,
  post_id uuid,
  user_id uuid,
  parent_id uuid,
  body text,
  created_at timestamptz,
  edited_at timestamptz,
  comment_count integer,
  like_count integer,
  repost_count integer,
  bookmark_count integer,
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
  lim int;
  off int;
  sort_recent boolean;
begin
  perform public.lounge_search_enforce_rate_limit();
  perform set_config('statement_timeout', '5000', true);

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  lim := greatest(1, least(coalesce(p_limit, 30), 60));
  off := greatest(0, coalesce(p_offset, 0));
  sort_recent := lower(coalesce(p_sort, 'engagement')) = 'recent';

  return query
  with candidates as (
    select
      fc.*,
      (
        coalesce(fc.like_count, 0)
        + coalesce(fc.comment_count, 0)
        + coalesce(fc.repost_count, 0)
      ) as score,
      extensions.similarity(lower(coalesce(fc.body, '')), term) as sim_score
    from public.feed_comments fc
    inner join public.community_feed_posts p on p.id = fc.post_id
    left join public.profiles pr on pr.user_id = fc.user_id
    left join public.profiles post_pr on post_pr.user_id = p.user_id
    where fc.hidden_at is null
      and p.hidden_at is null
      and (pr.user_id is null or pr.banned_at is null)
      and (post_pr.user_id is null or post_pr.banned_at is null)
      and (
        strpos(lower(coalesce(fc.body, '')), term) > 0
        or extensions.similarity(lower(coalesce(fc.body, '')), term) > 0.15
      )
  )
  select
    candidates.id,
    candidates.post_id,
    candidates.user_id,
    candidates.parent_id,
    candidates.body,
    candidates.created_at,
    candidates.edited_at,
    candidates.comment_count,
    candidates.like_count,
    candidates.repost_count,
    candidates.bookmark_count,
    candidates.media_url,
    candidates.gif_url,
    candidates.image_urls,
    candidates.stream_video_uid,
    candidates.stream_poster_url,
    candidates.stream_video_width,
    candidates.stream_video_height
  from candidates
  order by
    case when sort_recent then candidates.created_at end desc nulls last,
    case when not sort_recent then candidates.score end desc nulls last,
    candidates.sim_score desc,
    case when sort_recent then candidates.score end desc nulls last,
    candidates.created_at desc
  limit lim
  offset off;
end;
$$;
