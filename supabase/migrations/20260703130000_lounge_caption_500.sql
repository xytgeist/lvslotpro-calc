-- Lounge post caption + feed comment body cap 500 chars (display collapse stays client-side at 320).

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_caption_len_check;

alter table public.community_feed_posts
  add constraint community_feed_posts_caption_len_check
  check (char_length(caption) <= 500);

comment on column public.community_feed_posts.caption is 'Canonical feed caption (<= 500 chars).';

alter table public.feed_comments
  drop constraint if exists feed_comments_body_len;

alter table public.feed_comments
  add constraint feed_comments_body_len check (
    char_length(body) <= 500
    and (
      char_length(trim(body)) >= 1
      or (
        image_urls is not null
        and jsonb_typeof(image_urls) = 'array'
        and jsonb_array_length(image_urls) > 0
      )
      or length(trim(coalesce(media_url, ''))) > 0
      or length(trim(coalesce(gif_url, ''))) > 0
      or length(trim(coalesce(stream_video_uid, ''))) > 0
    )
  );

alter table public.lounge_post_drafts
  drop constraint if exists lounge_post_drafts_caption_len;

alter table public.lounge_post_drafts
  add constraint lounge_post_drafts_caption_len
  check (char_length(caption) <= 500);

create or replace function public.lounge_post_draft_thread_captions_valid(p_parts text[])
returns boolean
language sql
immutable
as $$
  select cardinality(coalesce(p_parts, '{}'::text[])) <= 25
    and coalesce(
      (
        select bool_and(char_length(part) <= 500)
        from unnest(coalesce(p_parts, '{}'::text[])) as part
      ),
      true
    );
$$;
