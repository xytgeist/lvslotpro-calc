-- One-shot Coffee force test: 7:13pm PT Jul 6 2026 (02:13 UTC Jul 7).

do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_odds_poll_coffee_force_test_20260706'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_odds_poll_coffee_force_test_20260706',
  '13 2 7 7 *',
  $$select public.invoke_lounge_odds_poll('daily_slates', true);$$
);
