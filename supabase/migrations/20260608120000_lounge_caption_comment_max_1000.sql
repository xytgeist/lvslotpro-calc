-- Raise lounge post caption + feed comment body cap from 280 to 1000 characters.

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_caption_len_check;

alter table public.community_feed_posts
  add constraint community_feed_posts_caption_len_check
  check (char_length(caption) <= 1000);

comment on column public.community_feed_posts.caption is 'Canonical feed caption (<= 1000 chars).';

alter table public.feed_comments
  drop constraint if exists feed_comments_body_len;

alter table public.feed_comments
  add constraint feed_comments_body_len
  check (char_length(body) >= 1 and char_length(body) <= 1000);
