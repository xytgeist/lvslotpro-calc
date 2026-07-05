-- Reschedule Scott odds pg_cron to Ryan spec:
--   daily_slates  — Coffee & Covers, random minute 6:00-7:59am PT (cron ticks every 5 min in window)
--   poll_edges    — +EV scan every 15 min, 24/7 (today's unplayed events only; no time-of-day gate in Edge)
--
-- Apply on prod after 20260704230000. Unschedules prior edge day/evening split jobs.
-- PDT (UTC-7): 6-8am PT ≈ hours 13-14 UTC. PST (UTC-8): adjust manually if needed.

do $$
declare
  jid int;
begin
  for jid in
    select jobid from cron.job
    where jobname in (
      'lounge_odds_poll_daily_slates',
      'lounge_odds_poll_edges_pt_day',
      'lounge_odds_poll_edges_pt_evening',
      'lounge_odds_poll_edges'
    )
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_odds_poll_daily_slates',
  '*/5 13-14 * * *',
  $$select public.invoke_lounge_odds_poll('daily_slates');$$
);

select cron.schedule(
  'lounge_odds_poll_edges',
  '*/15 * * * *',
  $$select public.invoke_lounge_odds_poll('poll_edges');$$
);
