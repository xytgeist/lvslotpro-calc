-- Raise per-post market chart embed cap from 6 → 12 (app + Edge aligned).

comment on column public.community_feed_posts.market_embeds is
  'Ordered array of market chart embeds (symbol, kind rolling|historical, window, quote, bars snapshot, og_image_url). Max 12 enforced in app + Edge.';

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_market_embeds_max;

alter table public.community_feed_posts
  add constraint community_feed_posts_market_embeds_max
  check (jsonb_array_length(market_embeds) <= 12);
