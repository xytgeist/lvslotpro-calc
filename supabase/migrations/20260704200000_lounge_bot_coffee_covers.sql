-- Coffee & Covers morning post kind for Scott Share odds bot.

alter table public.lounge_bot_publish_log
  drop constraint if exists lounge_bot_publish_log_post_kind_check;

alter table public.lounge_bot_publish_log
  add constraint lounge_bot_publish_log_post_kind_check
  check (post_kind in ('edge', 'slate', 'coffee_covers', 'wire', 'x', 'other'));

comment on column public.lounge_bot_publish_log.post_kind is
  'edge | slate (legacy) | coffee_covers (morning roundup) | wire | x | other';

alter table public.lounge_bot_odds_config
  add column if not exists coffee_covers_enabled boolean not null default true;

comment on column public.lounge_bot_odds_config.coffee_covers_enabled is
  'When true, daily_slates poll posts Coffee & Covers instead of legacy slate check-ins.';
