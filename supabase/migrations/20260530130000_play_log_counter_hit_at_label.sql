-- Rename metric display label (slug unchanged).

update public.play_log_metric_defs
set label = 'Counter hit at'
where slug = 'counter_at_hit';
