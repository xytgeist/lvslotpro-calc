-- Strict literal $TICKER post lookup for market chart modal (no pg_trgm fuzzy matches).
-- Dock search keeps lounge_search() fuzzy behavior.

create or replace function public.lounge_caption_has_cashtag(haystack text, tag text)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(tag, '') <> ''
    and lower(coalesce(haystack, '')) ~ (
      '(^|[^[:alnum:]_])\$'
      || regexp_replace(lower(trim(both from tag)), '([.*+?^${}()|\[\]\\])', '\\\1', 'g')
      || '([^[:alnum:]_]|$)'
    );
$$;

comment on function public.lounge_caption_has_cashtag(text, text) is
  'True when haystack contains a cashtag $TAG with word boundaries (matches client CASHTAG_RE).';

create or replace function public.lounge_search_cashtag_posts(
  p_cashtag text,
  p_sort text default 'engagement',
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  tag text;
  sort_recent boolean;
  lim int;
  off int;
  v_posts jsonb := '[]'::jsonb;
  v_has_more boolean := false;
  v_count int := 0;
begin
  perform public.lounge_search_enforce_rate_limit();
  perform set_config('statement_timeout', '5000', true);

  tag := upper(trim(both from coalesce(p_cashtag, '')));
  if tag = '' or char_length(tag) > 15 or tag !~ '^[A-Z][A-Z0-9.-]{0,14}$' then
    return jsonb_build_object(
      'posts', '[]'::jsonb,
      'pagination', jsonb_build_object('posts_has_more', false)
    );
  end if;

  sort_recent := lower(coalesce(p_sort, 'engagement')) = 'recent';
  lim := greatest(1, least(coalesce(p_limit, 20), 80));
  off := greatest(0, coalesce(p_offset, 0));

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
      c.category_pills,
      c.repost_target_unavailable,
      (
        coalesce(c.like_count, 0)
        + coalesce(c.comment_count, 0)
        + coalesce(c.repost_count, 0)
      ) as score
    from public.community_feed_posts c
    left join public.profiles pr on pr.user_id = c.user_id
    where c.hidden_at is null
      and (pr.user_id is null or pr.banned_at is null)
      and public.lounge_caption_has_cashtag(c.caption, tag)
  ),
  ordered as (
    select *
    from candidates
    order by
      case when sort_recent then created_at end desc nulls last,
      case when not sort_recent then score end desc nulls last,
      created_at desc
    limit lim + 1
    offset off
  )
  select
    coalesce(
      (
        select jsonb_agg(to_jsonb(p) - 'score')
        from (
          select *
          from ordered
          limit lim
        ) p
      ),
      '[]'::jsonb
    ),
    (select count(*) > lim from ordered)
  into v_posts, v_has_more;

  v_count := jsonb_array_length(v_posts);

  perform public.lounge_search_log_analytics(
    '$' || tag,
    coalesce(p_sort, 'engagement'),
    v_count,
    0,
    0,
    off,
    0,
    0
  );

  return jsonb_build_object(
    'posts', v_posts,
    'pagination', jsonb_build_object('posts_has_more', coalesce(v_has_more, false))
  );
end;
$$;

revoke all on function public.lounge_search_cashtag_posts(text, text, integer, integer) from public;
grant execute on function public.lounge_search_cashtag_posts(text, text, integer, integer) to authenticated;
