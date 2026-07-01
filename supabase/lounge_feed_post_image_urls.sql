-- Ordered list of uploaded image public URLs (`lounge-feed`) for posts with one or more photos.
-- Apply after `lounge_feed_post_media.sql`. Keep `media_url` as the first image (or sole GIF) for older clients.
--
-- Convention:
--   * `image_urls` jsonb array of strings (0..N). When length >= 1, UI shows a horizontal swipe carousel.
--   * `media_url` = first image URL when `image_urls` is non-empty, or sole GIF URL when no images.
--   * `gif_url` = optional external GIF (Klipy) alongside images.

alter table public.community_feed_posts
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

comment on column public.community_feed_posts.image_urls is
  'Ordered public URLs for uploaded post images (bucket lounge-feed). Empty when using legacy single media_url only.';
