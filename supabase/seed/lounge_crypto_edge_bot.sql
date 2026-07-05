-- Crypto Edge bot setup — run AFTER creating auth user + profile (or use Bot Portal wizard).
-- Topic-tier crypto scoring drives publishes; no default ticker watchlist.

-- insert into public.lounge_bot_accounts (
--   user_id, slug, pipeline, review_mode, display_name, run_state,
--   category_pills_default, max_posts_per_day, max_posts_per_hour, publish_score_threshold, config
-- ) values (
--   '<BOT_USER_UUID>',
--   'crypto-edge',
--   'market_news',
--   'automatic',
--   'Crypto Edge',
--   'stopped',
--   array['crypto', 'trading'],
--   12,
--   4,
--   55,
--   '{"news_profile":"crypto"}'::jsonb
-- );

-- update public.profiles set
--   handle = 'cryptoedge',
--   display_name = 'Crypto Edge',
--   bio = '24/7 crypto headlines for traders who still read the wire.',
--   is_bot = true
-- where user_id = '<BOT_USER_UUID>'::uuid;

-- select public.lounge_bot_seed_crypto_news_sources('<BOT_USER_UUID>'::uuid);
