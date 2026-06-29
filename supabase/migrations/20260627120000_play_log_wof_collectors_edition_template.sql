-- Play Logbook — WoF 4D CE column prize template.

insert into public.play_log_metric_defs (slug, label, value_type, sort_order) values
  ('r1_prize', 'R1 prize (cr)', 'integer', 21),
  ('r2_prize', 'R2 prize (cr)', 'integer', 22),
  ('r3_prize', 'R3 prize (cr)', 'integer', 23),
  ('r4_prize', 'R4 prize (cr)', 'integer', 24),
  ('r5_prize', 'R5 prize (cr)', 'integer', 25)
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
    'wof-collectors-edition',
    'Wheel of Fortune 4D CE',
    'wheel-of-fortune-4d-collectors-edition',
    'wof-collectors-edition',
    array[
      'r1_prize',
      'r2_prize',
      'r3_prize',
      'r4_prize',
      'r5_prize',
      'bet_size',
      'denom',
      'money_in',
      'money_out',
      'acquisition_fee',
      'spin_count',
      'bonus_count'
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
    'wof-collectors-edition',
    'Wheel of Fortune 4D CE',
    'wheel-of-fortune-4d-collectors-edition',
    'wof-collectors-edition',
    array[
      'r1_prize',
      'r2_prize',
      'r3_prize',
      'r4_prize',
      'r5_prize',
      'bet_size',
      'denom',
      'money_in',
      'money_out',
      'acquisition_fee',
      'spin_count',
      'bonus_count'
    ]::text[]
  )
) as v(slug, display_name, machine_slug, calculator_slug, metric_slugs)
where t.is_system = true and t.slug = v.slug;
