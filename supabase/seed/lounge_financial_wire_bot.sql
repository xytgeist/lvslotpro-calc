-- Financial wire bot setup (test) — run AFTER creating auth user + profile for the bot.
-- Replace <BOT_USER_UUID> with the auth.users id.

-- insert into public.lounge_bot_accounts (
--   user_id, slug, pipeline, review_mode, display_name, enabled,
--   category_pills_default, max_posts_per_day, max_posts_per_hour, publish_score_threshold, config
-- ) values (
--   '<BOT_USER_UUID>',
--   'financial-wire',
--   'market_news',
--   'automatic',
--   'Edge Wire',
--   false,
--   array['stocks','trading'],
--   12,
--   4,
--   55,
--   '{"watchlist_tickers":["AAPL","NVDA","MSFT","AMZN","GOOGL","META","TSLA","SPY","QQQ","JPM","BAC","XOM","DKNG","MGM"]}'::jsonb
-- );

-- select public.lounge_bot_seed_financial_wire_sources('<BOT_USER_UUID>'::uuid);

-- When ready: update public.lounge_bot_accounts set enabled = true where slug = 'financial-wire';
