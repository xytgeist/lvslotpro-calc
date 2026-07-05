-- pg_cron → pg_net POST to Edge `lounge-odds-poll` for sports odds bots (Scott Share, etc.).
--
-- Prereqs (Supabase Dashboard → Database → Extensions): enable **pg_cron** and **pg_net**.
--
-- Vault (once per Supabase project — SQL Editor):
--   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'lounge_odds_poll_project_url');
--   select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'lounge_odds_poll_service_role_key');
-- Use the **service_role** key (legacy eyJ… JWT). Cron auth matches Edge `authorize()` service-role bearer check.
--
-- Edge: deploy `lounge-odds-poll` + set **THE_ODDS_API_KEY** before expecting posts.
--
-- Schedules (America/Los_Angeles — PDT, UTC-7 in summer):
--   daily_slates  — every 5 min, hours 14-16 UTC (7:00-9:59am PT); Edge time gate + per-bot random minute
--   poll_edges    — every 30 min, 8am-8pm PT (15-23 UTC + 0-3 UTC)
--
-- Verify jobs:
--   select * from cron.job where jobname like 'lounge_odds_poll_%';
--   select * from cron.job_run_details order by start_time desc limit 20;
-- Manual smoke (service role in Vault must exist):
--   select public.invoke_lounge_odds_poll('daily_slates');
--   select public.invoke_lounge_odds_poll('poll_edges');

create or replace function public.invoke_lounge_odds_poll(p_action text)
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
  if action not in ('poll_edges', 'daily_slates') then
    raise warning 'invoke_lounge_odds_poll: action must be poll_edges or daily_slates (got %)', p_action;
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
      'action', action
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

comment on function public.invoke_lounge_odds_poll(text) is
  'pg_cron helper: POST lounge-odds-poll for each running odds_api bot. Vault: lounge_odds_poll_project_url, lounge_odds_poll_service_role_key.';

revoke all on function public.invoke_lounge_odds_poll(text) from public;
grant execute on function public.invoke_lounge_odds_poll(text) to postgres;

-- Morning Coffee & Covers: every 5 min, 7:00-9:59am PT (14:00-16:59 UTC during PDT).
do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_odds_poll_daily_slates'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_odds_poll_daily_slates',
  '*/5 14-16 * * *',
  $$select public.invoke_lounge_odds_poll('daily_slates');$$
);

-- +EV edge scan: every 30 min, 8am-8pm PT (12h).
do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_odds_poll_edges_pt_day'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_odds_poll_edges_pt_day',
  '0,30 15-23 * * *',
  $$select public.invoke_lounge_odds_poll('poll_edges');$$
);

do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_odds_poll_edges_pt_evening'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_odds_poll_edges_pt_evening',
  '0,30 0-3 * * *',
  $$select public.invoke_lounge_odds_poll('poll_edges');$$
);
