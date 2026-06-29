-- Play Logbook — keep # Spins / # Bonuses last in template metric_slugs (Log Play form order).

create or replace function public.play_log_metric_slugs_spin_bonus_last(slugs text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    (
      select array_agg(s order by idx)
      from unnest(slugs) with ordinality as t(s, idx)
      where s not in ('spin_count', 'bonus_count')
    ),
    '{}'::text[]
  )
  || coalesce(
    (
      select array_agg(s order by case s when 'spin_count' then 1 when 'bonus_count' then 2 end)
      from unnest(slugs) as t(s)
      where s in ('spin_count', 'bonus_count')
    ),
    '{}'::text[]
  );
$$;

update public.play_log_game_templates
set
  metric_slugs = public.play_log_metric_slugs_spin_bonus_last(metric_slugs),
  updated_at = now()
where metric_slugs && array['spin_count', 'bonus_count']::text[];

drop function public.play_log_metric_slugs_spin_bonus_last(text[]);
