-- Play Logbook — EV ($) field is optional (label only).

update public.play_log_metric_defs
set label = 'EV ($) (optional)'
where slug = 'expected_ev_usd';
