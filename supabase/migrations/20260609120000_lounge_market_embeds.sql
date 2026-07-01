-- Lounge feed market chart embeds (stocks + crypto) on community_feed_posts.

alter table public.community_feed_posts
  add column if not exists market_embeds jsonb not null default '[]'::jsonb;

comment on column public.community_feed_posts.market_embeds is
  'Ordered array of market chart embeds (symbol, kind rolling|historical, window, quote, bars snapshot, og_image_url). Max 6 enforced in app + Edge.';

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_market_embeds_is_array;

alter table public.community_feed_posts
  add constraint community_feed_posts_market_embeds_is_array
  check (jsonb_typeof(market_embeds) = 'array');

alter table public.community_feed_posts
  drop constraint if exists community_feed_posts_market_embeds_max;

alter table public.community_feed_posts
  add constraint community_feed_posts_market_embeds_max
  check (jsonb_array_length(market_embeds) <= 6);

-- Shared rolling-quote cache (server-side batch refresh for feed minis).
create table if not exists public.market_quote_cache (
  cache_key text primary key,
  asset_class text not null,
  symbol text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

create index if not exists market_quote_cache_fetched_at_idx
  on public.market_quote_cache (fetched_at desc);

comment on table public.market_quote_cache is
  'Rolling window sparkline + headline quote per symbol (TTL enforced in Edge, not DB).';

alter table public.market_quote_cache enable row level security;

drop policy if exists market_quote_cache_select_authenticated on public.market_quote_cache;
create policy market_quote_cache_select_authenticated on public.market_quote_cache
  for select to authenticated, anon
  using (true);
