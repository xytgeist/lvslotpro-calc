-- Play Logbook — Buffalo Diamond primary game template (3× FG meters + calc snapshot fields).

insert into public.play_log_metric_defs (slug, label, value_type, sort_order) values
  ('green_fg', 'Green FG (2×)', 'integer', 18),
  ('blue_fg',  'Blue FG (3×)',  'integer', 19),
  ('gold_fg',  'Gold FG (4×)',  'integer', 20)
on conflict (slug) do update set
  label = excluded.label,
  value_type = excluded.value_type,
  sort_order = excluded.sort_order;

insert into public.play_log_game_templates (
  slug, display_name, machine_slug, calculator_slug, metric_slugs, is_system, user_id
)
select
  v.slug,
  v.display_name,
  v.machine_slug,
  v.calculator_slug,
  v.metric_slugs,
  true,
  null::uuid
from (values
  (
    'buffalo-diamond',
    'Buffalo Diamond',
    'buffalo-diamond',
    'buffalo-diamond',
    array[
      'green_fg',
      'blue_fg',
      'gold_fg',
      'bet_size',
      'denom',
      'spin_count',
      'bonus_count',
      'money_in',
      'money_out',
      'current_ev_rtp',
      'average_case_mult',
      'average_case_usd',
      'acquisition_fee'
    ]::text[]
  )
) as v(slug, display_name, machine_slug, calculator_slug, metric_slugs)
where not exists (
  select 1
  from public.play_log_game_templates t
  where t.is_system = true and t.slug = v.slug
);

update public.play_log_game_templates t
set
  display_name = v.display_name,
  machine_slug = v.machine_slug,
  calculator_slug = v.calculator_slug,
  metric_slugs = v.metric_slugs,
  updated_at = now()
from (values
  (
    'buffalo-diamond',
    'Buffalo Diamond',
    'buffalo-diamond',
    'buffalo-diamond',
    array[
      'green_fg',
      'blue_fg',
      'gold_fg',
      'bet_size',
      'denom',
      'spin_count',
      'bonus_count',
      'money_in',
      'money_out',
      'current_ev_rtp',
      'average_case_mult',
      'average_case_usd',
      'acquisition_fee'
    ]::text[]
  )
) as v(slug, display_name, machine_slug, calculator_slug, metric_slugs)
where t.is_system = true and t.slug = v.slug;
