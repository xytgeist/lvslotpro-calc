-- Cron invoke: optional force (bypasses Coffee 6-8am PT gate + same-day dedupe on Edge).
-- One-shot test job: 7:10pm PT Jul 6 2026 (02:10 UTC Jul 7) — remove after smoke.

create or replace function public.invoke_lounge_odds_poll(p_action text, p_force boolean default false)
returns void
language plpgsql
security definer
set search_path = public, vault, net, cron, extensions, pg_temp
as $$
declare
  service_key text;
  base_url text;
  req_id bigint;
  bot record;
  action text;
  body jsonb;
begin
  action := lower(btrim(coalesce(p_action, '')));
  if action not in ('poll_edges', 'daily_slates', 'best_bet_hour', 'value_bet_radar') then
    raise warning 'invoke_lounge_odds_poll: action must be poll_edges, daily_slates, best_bet_hour, or value_bet_radar (got %)', p_action;
    return;
  end if;

  select btrim(ds.decrypted_secret)
  into service_key
  from vault.decrypted_secrets as ds
  where ds.name = 'lounge_odds_poll_service_role_key'
  limit 1;

  select btrim(ds.decrypted_secret)
  into base_url
  from vault.decrypted_secrets as ds
  where ds.name = 'lounge_odds_poll_project_url'
  limit 1;

  if service_key is null or service_key = '' then
    raise warning 'invoke_lounge_odds_poll: add vault secret lounge_odds_poll_service_role_key (service_role JWT)';
    return;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'invoke_lounge_odds_poll: add vault secret lounge_odds_poll_project_url';
    return;
  end if;

  if service_key ~* '^bearer\s+' then
    service_key := btrim(regexp_replace(service_key, '^[Bb]earer\s+', ''));
  end if;

  base_url := rtrim(btrim(base_url), '/');

  for bot in
    select a.slug
    from public.lounge_bot_accounts a
    where a.pipeline = 'odds_api'
      and a.run_state = 'running'
      and a.enabled = true
    order by a.slug
  loop
    body := jsonb_build_object(
      'slug', bot.slug,
      'action', action,
      'force', coalesce(p_force, false)
    );

    begin
      select
        net.http_post(
          url := base_url || '/functions/v1/lounge-odds-poll',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', service_key,
            'Authorization', 'Bearer ' || service_key
          ),
          body := body,
          timeout_milliseconds := 180000
        )
      into req_id;
    exception
      when others then
        raise warning 'invoke_lounge_odds_poll: % for bot % — %', action, bot.slug, sqlerrm;
    end;
  end loop;
exception
  when others then
    raise warning 'invoke_lounge_odds_poll: %', sqlerrm;
end;
$$;

comment on function public.invoke_lounge_odds_poll(text, boolean) is
  'pg_cron helper: POST lounge-odds-poll for each running odds_api bot. p_force=true bypasses Coffee morning window (Edge) and same-day dedupe.';

-- Drop old single-arg overload so cron calls resolve cleanly.
drop function if exists public.invoke_lounge_odds_poll(text);

grant execute on function public.invoke_lounge_odds_poll(text, boolean) to postgres;

-- One-shot: 02:12 UTC Jul 7 2026 = 7:12pm PT Jul 6 2026 (PDT).
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
  '12 2 7 7 *',
  $$select public.invoke_lounge_odds_poll('daily_slates', true);$$
);
