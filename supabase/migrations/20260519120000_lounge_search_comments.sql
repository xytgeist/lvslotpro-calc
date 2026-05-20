-- Phase G extension: comment body search. See supabase/lounge_search_phase_g.sql.

create index if not exists feed_comments_search_body_trgm_idx
  on public.feed_comments using gin (lower(body) extensions.gin_trgm_ops);

create or replace function public.lounge_search_comments(
  p_query text,
  p_limit integer default 30,
  p_offset integer default 0
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
begin
  if auth.uid() is null then
    raise exception 'LOUNGE_SEARCH_AUTH_REQUIRED'
      using message = 'Sign in to search the Lounge.';
  end if;

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  lim := greatest(1, least(coalesce(p_limit, 30), 60));
  off := greatest(0, coalesce(p_offset, 0));

  return query
  with candidates as (
    select
      fc.*,
      (
        coalesce(fc.like_count, 0)
        + coalesce(fc.comment_count, 0)
        + coalesce(fc.repost_count, 0)
      ) as score
    from public.feed_comments fc
    inner join public.community_feed_posts p on p.id = fc.post_id
    left join public.profiles pr on pr.user_id = fc.user_id
    left join public.profiles post_pr on post_pr.user_id = p.user_id
    where fc.hidden_at is null
      and p.hidden_at is null
      and (pr.user_id is null or pr.banned_at is null)
      and (post_pr.user_id is null or post_pr.banned_at is null)
      and lower(fc.body) like '%' || term || '%'
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
  order by candidates.score desc, candidates.created_at desc
  limit lim
  offset off;
end;
$$;

revoke all on function public.lounge_search_comments(text, integer, integer) from public;
grant execute on function public.lounge_search_comments(text, integer, integer) to authenticated;
