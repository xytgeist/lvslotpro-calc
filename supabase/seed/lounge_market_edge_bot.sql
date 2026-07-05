-- Market Edge bot setup — run AFTER creating auth user + profile (or use Bot Portal wizard).
-- Topic-tier scoring drives publishes; no default ticker watchlist.

-- insert into public.lounge_bot_accounts (
--   user_id, slug, pipeline, review_mode, display_name, run_state,
--   category_pills_default, max_posts_per_day, max_posts_per_hour, publish_score_threshold, config
-- ) values (
--   '<BOT_USER_UUID>',
--   'market-edge',
--   'market_news',
--   'automatic',
--   'Market Edge',
--   'stopped',
--   array['stocks', 'trading'],
--   12,
--   4,
--   55,
--   '{}'::jsonb
-- );

-- update public.profiles set
--   handle = 'marketedge',
--   display_name = 'Market Edge',
--   bio = '24/7 Breaking News headlines for professional day traders.',
--   is_bot = true
-- where user_id = '<BOT_USER_UUID>'::uuid;

-- select public.lounge_bot_seed_market_news_sources('<BOT_USER_UUID>'::uuid);
