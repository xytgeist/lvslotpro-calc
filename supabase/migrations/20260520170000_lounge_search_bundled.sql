-- Bundled Lounge search: one RPC, index-aware matching, pagination meta, analytics.
-- Replaces triple client calls; prefer public.lounge_search() over lounge_search_* splits.
-- See supabase/lounge_search_phase_g.sql.

create index if not exists profiles_search_about_me_trgm_idx
  on public.profiles using gin (lower(about_me) extensions.gin_trgm_ops);

create or replace function public.lounge_escape_like_pattern(p text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(coalesce(p, ''), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');
$$;

comment on function public.lounge_escape_like_pattern(text) is
  'Escape %, _, and \\ for LIKE ... ESCAPE ''\\'' (safe substring patterns).';

create or replace function public.lounge_search_text_matches(haystack text, needle text)
returns boolean
language sql
stable
as $$
  select
    coalesce(needle, '') <> ''
    and (
      lower(coalesce(haystack, '')) like '%' || public.lounge_escape_like_pattern(needle) || '%' escape '\'
      or (
        char_length(needle) >= 3
        and extensions.similarity(lower(coalesce(haystack, '')), needle) > 0.15
      )
    );
$$;

comment on function public.lounge_search_text_matches(text, text) is
  'Escaped LIKE substring (GIN trgm-friendly) OR pg_trgm similarity when needle length >= 3.';

create table if not exists public.lounge_search_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  sort text not null default 'engagement',
  posts_count integer not null default 0,
  profiles_count integer not null default 0,
  comments_count integer not null default 0,
  posts_offset integer not null default 0,
  comments_offset integer not null default 0,
  profiles_offset integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lounge_search_analytics_created_idx
  on public.lounge_search_analytics (created_at desc);

create index if not exists lounge_search_analytics_user_created_idx
  on public.lounge_search_analytics (user_id, created_at desc);

comment on table public.lounge_search_analytics is
  'Append-only Lounge search telemetry (query + result counts). Insert via lounge_search_log_analytics only.';

alter table public.lounge_search_analytics enable row level security;

create or replace function public.lounge_search_log_analytics(
  p_query text,
  p_sort text,
  p_posts_count integer,
  p_profiles_count integer,
  p_comments_count integer,
  p_posts_offset integer,
  p_comments_offset integer,
  p_profiles_offset integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return;
  end if;

  insert into public.lounge_search_analytics (
    user_id,
    query,
    sort,
    posts_count,
    profiles_count,
    comments_count,
    posts_offset,
    comments_offset,
    profiles_offset
  )
  values (
    v_uid,
    left(coalesce(p_query, ''), 128),
    coalesce(nullif(trim(p_sort), ''), 'engagement'),
    greatest(0, coalesce(p_posts_count, 0)),
    greatest(0, coalesce(p_profiles_count, 0)),
    greatest(0, coalesce(p_comments_count, 0)),
    greatest(0, coalesce(p_posts_offset, 0)),
    greatest(0, coalesce(p_comments_offset, 0)),
    greatest(0, coalesce(p_profiles_offset, 0))
  );
end;
$$;

revoke all on function public.lounge_search_log_analytics(text, text, integer, integer, integer, integer, integer, integer) from public;

-- One logical search per call (was 90 / 3 RPCs).
create or replace function public.lounge_search_enforce_rate_limit()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_kind text := 'lounge_search';
  v_window interval := interval '5 minutes';
  v_limit integer := 30;
  v_window_start timestamptz;
  v_count integer;
  v_oldest_in_window timestamptz;
  v_retry_seconds integer;
  v_role text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'LOUNGE_SEARCH_AUTH_REQUIRED'
      using message = 'Sign in to search the Lounge.';
  end if;

  select role into v_role from public.profiles where user_id = v_uid;
  if v_role in ('admin', 'moderator') then
    return;
  end if;

  v_window_start := now() - v_window;

  select count(*)
  into v_count
  from public.rate_limit_events e
  where e.user_id = v_uid
    and e.kind = v_kind
    and e.created_at >= v_window_start;

  if v_count >= v_limit then
    select min(e.created_at)
    into v_oldest_in_window
    from public.rate_limit_events e
    where e.user_id = v_uid
      and e.kind = v_kind
      and e.created_at >= v_window_start;

    v_retry_seconds := greatest(
      1,
      ceil(extract(epoch from ((coalesce(v_oldest_in_window, now()) + v_window) - now())))::int
    );

    raise exception 'Rate limit exceeded: retry_in_seconds=% (max % searches per % minutes)', v_retry_seconds, v_limit, extract(epoch from v_window) / 60
      using errcode = 'P0001';
  end if;

  insert into public.rate_limit_events (user_id, kind, window_start)
  values (v_uid, v_kind, date_trunc('minute', now()));
end;
$$;

create or replace function public.lounge_search(
  p_query text,
  p_sort text default 'engagement',
  p_posts_limit integer default 20,
  p_posts_offset integer default 0,
  p_profiles_limit integer default 20,
  p_profiles_offset integer default 0,
  p_comments_limit integer default 15,
  p_comments_offset integer default 0
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  term text;
  hash_term text;
  handle_term text;
  is_word boolean;
  is_handle_query boolean;
  sort_recent boolean;
  posts_lim int;
  posts_off int;
  profiles_lim int;
  profiles_off int;
  comments_lim int;
  comments_off int;
  v_posts jsonb := '[]'::jsonb;
  v_profiles jsonb := '[]'::jsonb;
  v_comments jsonb := '[]'::jsonb;
  v_posts_has_more boolean := false;
  v_profiles_has_more boolean := false;
  v_comments_has_more boolean := false;
  v_posts_count int := 0;
  v_profiles_count int := 0;
  v_comments_count int := 0;
begin
  perform public.lounge_search_enforce_rate_limit();
  perform set_config('statement_timeout', '5000', true);

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return jsonb_build_object(
      'posts', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'comments', '[]'::jsonb,
      'pagination', jsonb_build_object(
        'posts_has_more', false,
        'profiles_has_more', false,
        'comments_has_more', false
      )
    );
  end if;

  is_handle_query := left(term, 1) = '@';
  handle_term := term;
  if left(handle_term, 1) = '@' then
    handle_term := substring(handle_term from 2);
  end if;
  if is_handle_query and char_length(handle_term) < 2 then
    return jsonb_build_object(
      'posts', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'comments', '[]'::jsonb,
      'pagination', jsonb_build_object(
        'posts_has_more', false,
        'profiles_has_more', false,
        'comments_has_more', false
      )
    );
  end if;

  hash_term := term;
  if left(hash_term, 1) = '#' then
    hash_term := substring(hash_term from 2);
  elsif left(hash_term, 1) = '@' then
    hash_term := substring(hash_term from 2);
  end if;
  is_word := char_length(hash_term) > 0 and position(' ' in hash_term) = 0;
  sort_recent := lower(coalesce(p_sort, 'engagement')) = 'recent';

  posts_lim := greatest(1, least(coalesce(p_posts_limit, 20), 80));
  posts_off := greatest(0, coalesce(p_posts_offset, 0));
  profiles_lim := greatest(1, least(coalesce(p_profiles_limit, 20), 40));
  profiles_off := greatest(0, coalesce(p_profiles_offset, 0));
  comments_lim := greatest(1, least(coalesce(p_comments_limit, 15), 60));
  comments_off := greatest(0, coalesce(p_comments_offset, 0));

  with candidates as (
    select
      c.id,
      c.caption,
      c.game_title,
      c.game_slug,
      c.user_id,
      c.created_at,
      c.edited_at,
      c.pinned,
      c.like_count,
      c.comment_count,
      c.repost_count,
      c.repost_of_post_id,
      c.repost_of_comment_id,
      c.is_plain_repost,
      c.media_url,
      c.gif_url,
      c.image_urls,
      c.stream_video_uid,
      c.stream_poster_url,
      c.stream_video_width,
      c.stream_video_height,
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
                  public.lounge_search_text_matches(ap.handle, handle_term)
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
            public.lounge_search_text_matches(c.caption, term)
            or public.lounge_search_text_matches(c.game_title, term)
            or extensions.similarity(lower(coalesce(c.caption, '')), term) > 0.15
            or extensions.similarity(lower(coalesce(c.game_title, '')), term) > 0.15
            or (is_word and public.lounge_search_text_matches(c.caption, '#' || hash_term))
          )
        end
      )
  ),
  ordered as (
    select *
    from candidates
    order by
      bucket asc,
      case when sort_recent then created_at end desc nulls last,
      case when not sort_recent then score end desc nulls last,
      sim_score desc,
      case when sort_recent then score end desc nulls last,
      created_at desc
    limit posts_lim + 1
    offset posts_off
  )
  select
    coalesce(
      (
        select jsonb_agg(to_jsonb(p) - 'bucket' - 'score' - 'sim_score')
        from (
          select *
          from ordered
          limit posts_lim
        ) p
      ),
      '[]'::jsonb
    ),
    (select count(*) > posts_lim from ordered)
  into v_posts, v_posts_has_more;

  v_posts_count := jsonb_array_length(v_posts);

  with matched as (
    select
      p.user_id,
      p.handle,
      p.display_name,
      p.avatar_url,
      p.role,
      coalesce(p.is_og, false) as is_og,
      p.about_me,
      case
        when is_handle_query and lower(p.handle) = handle_term then 0
        when is_handle_query and starts_with(lower(p.handle), handle_term) then 1
        when not is_handle_query and lower(p.handle) = handle_term then 0
        when not is_handle_query and starts_with(lower(p.handle), handle_term) then 1
        when not is_handle_query and starts_with(lower(coalesce(p.display_name, '')), term) then 2
        when not is_handle_query and public.lounge_search_text_matches(p.about_me, term) then 3
        else 4
      end as rank_bucket,
      extensions.similarity(lower(p.handle), handle_term) as handle_sim,
      greatest(
        extensions.similarity(lower(coalesce(p.display_name, '')), term),
        extensions.similarity(lower(coalesce(p.about_me, '')), term)
      ) as profile_sim
    from public.profiles p
    where p.banned_at is null
      and (
        case
          when is_handle_query then (
            public.lounge_search_text_matches(p.handle, handle_term)
            or extensions.similarity(lower(p.handle), handle_term) > 0.15
          )
          else (
            public.lounge_search_text_matches(p.handle, handle_term)
            or public.lounge_search_text_matches(p.display_name, term)
            or public.lounge_search_text_matches(p.about_me, term)
            or extensions.similarity(lower(p.handle), handle_term) > 0.15
            or extensions.similarity(lower(coalesce(p.display_name, '')), term) > 0.15
            or extensions.similarity(lower(coalesce(p.about_me, '')), term) > 0.15
          )
        end
      )
  ),
  ordered as (
    select *
    from matched
    order by rank_bucket asc, handle_sim desc, profile_sim desc, display_name asc
    limit profiles_lim + 1
    offset profiles_off
  )
  select
    coalesce(
      (
        select jsonb_agg(to_jsonb(p) - 'rank_bucket' - 'handle_sim' - 'profile_sim')
        from (
          select user_id, handle, display_name, avatar_url, role, is_og, about_me
          from ordered
          limit profiles_lim
        ) p
      ),
      '[]'::jsonb
    ),
    (select count(*) > profiles_lim from ordered)
  into v_profiles, v_profiles_has_more;

  v_profiles_count := jsonb_array_length(v_profiles);

  with candidates as (
    select
      fc.id,
      fc.post_id,
      fc.user_id,
      fc.parent_id,
      fc.body,
      fc.created_at,
      fc.edited_at,
      fc.comment_count,
      fc.like_count,
      fc.repost_count,
      fc.bookmark_count,
      fc.media_url,
      fc.gif_url,
      fc.image_urls,
      fc.stream_video_uid,
      fc.stream_poster_url,
      fc.stream_video_width,
      fc.stream_video_height,
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
        public.lounge_search_text_matches(fc.body, term)
        or extensions.similarity(lower(coalesce(fc.body, '')), term) > 0.15
      )
  ),
  ordered as (
    select *
    from candidates
    order by
      case when sort_recent then created_at end desc nulls last,
      case when not sort_recent then score end desc nulls last,
      sim_score desc,
      case when sort_recent then score end desc nulls last,
      created_at desc
    limit comments_lim + 1
    offset comments_off
  )
  select
    coalesce(
      (
        select jsonb_agg(to_jsonb(c) - 'score' - 'sim_score')
        from (
          select *
          from ordered
          limit comments_lim
        ) c
      ),
      '[]'::jsonb
    ),
    (select count(*) > comments_lim from ordered)
  into v_comments, v_comments_has_more;

  v_comments_count := jsonb_array_length(v_comments);

  perform public.lounge_search_log_analytics(
    term,
    coalesce(p_sort, 'engagement'),
    v_posts_count,
    v_profiles_count,
    v_comments_count,
    posts_off,
    comments_off,
    profiles_off
  );

  return jsonb_build_object(
    'posts', v_posts,
    'profiles', v_profiles,
    'comments', v_comments,
    'pagination', jsonb_build_object(
      'posts_has_more', coalesce(v_posts_has_more, false),
      'profiles_has_more', coalesce(v_profiles_has_more, false),
      'comments_has_more', coalesce(v_comments_has_more, false)
    )
  );
end;
$$;

revoke all on function public.lounge_search(
  text, text, integer, integer, integer, integer, integer, integer
) from public;
grant execute on function public.lounge_search(
  text, text, integer, integer, integer, integer, integer, integer
) to authenticated;

-- Legacy split RPCs: keep for SQL editor / rollback; client uses lounge_search only.
revoke execute on function public.lounge_search_posts(text, integer, integer, text) from authenticated;
revoke execute on function public.lounge_search_profiles(text, integer, text) from authenticated;
revoke execute on function public.lounge_search_comments(text, integer, integer, text) from authenticated;
