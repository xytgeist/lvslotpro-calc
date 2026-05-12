-- Optional second media slot: external GIF (e.g. Klipy) when the post also has an uploaded image in `media_url`.
-- Apply in Supabase after `lounge_feed_post_media.sql`.
--
-- Convention:
--   * GIF-only posts: `media_url` = GIF URL, `gif_url` = null (unchanged from before).
--   * Image-only: `media_url` = image URL, `gif_url` = null.
--   * Image + GIF: `media_url` = uploaded image URL, `gif_url` = external GIF URL.

alter table public.community_feed_posts
  add column if not exists gif_url text;

comment on column public.community_feed_posts.gif_url is
  'External GIF URL when combined with an uploaded image in media_url; null when the sole attachment is a GIF (stored in media_url).';
