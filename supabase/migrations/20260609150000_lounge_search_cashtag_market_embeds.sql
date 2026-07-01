-- Market chart modal posts: match caption $TICKER or attached market_embeds (picker-only posts).

create or replace function public.lounge_market_embed_elem_matches_ticker(elem jsonb, tag text)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(tag, '') <> ''
    and (
      upper(trim(both from coalesce(elem->>'display_symbol', ''))) = upper(trim(both from tag))
      or upper(trim(both from coalesce(elem->>'symbol', ''))) = upper(trim(both from tag))
    );
$$;

comment on function public.lounge_market_embed_elem_matches_ticker(jsonb, text) is
  'True when one market_embed object display_symbol or Finnhub symbol equals tag (case-insensitive).';

create or replace function public.lounge_post_has_market_embed_ticker(embeds jsonb, tag text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(embeds, '[]'::jsonb)) as elem
    where public.lounge_market_embed_elem_matches_ticker(elem, tag)
  );
$$;

comment on function public.lounge_post_has_market_embed_ticker(jsonb, text) is
  'True when market_embeds array includes a chart for tag.';

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
      c.market_embeds,
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
        public.lounge_caption_has_cashtag(c.caption, tag)
        or public.lounge_post_has_market_embed_ticker(c.market_embeds, tag)
      )
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
