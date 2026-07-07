-- Scott live poll: Rundown-based period/halftime milestones every 5 min (10am-2am PT).
-- Keeps poll_edges at 15 min for +EV / line movement / arb (no live content there).
-- Apply on test + prod; redeploy lounge-odds-poll after apply.

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
  if action not in ('poll_edges', 'poll_live', 'daily_slates', 'best_bet_hour', 'value_bet_radar') then
    raise warning 'invoke_lounge_odds_poll: action must be poll_edges, poll_live, daily_slates, best_bet_hour, or value_bet_radar (got %)', p_action;
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
  'pg_cron helper: POST lounge-odds-poll for each running odds_api bot. Actions: poll_edges, poll_live, daily_slates, best_bet_hour, value_bet_radar.';

grant execute on function public.invoke_lounge_odds_poll(text, boolean) to postgres;

-- Portal async queue: allow poll_live manual smoke.
create or replace function public.admin_lounge_bot_queue_odds_poll(
  p_slug text,
  p_action text default 'poll_edges',
  p_dry_run boolean default false,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, vault, net, extensions, pg_temp
as $$
declare
  service_key text;
  base_url text;
  req_id bigint;
  v_action text;
  body jsonb;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  v_slug := btrim(coalesce(p_slug, ''));
  if v_slug = '' then
    raise exception 'slug required';
  end if;

  v_action := lower(btrim(coalesce(p_action, '')));
  if v_action not in ('poll_edges', 'poll_live', 'daily_slates', 'best_bet_hour', 'value_bet_radar') then
    raise exception 'invalid action: %', p_action;
  end if;

  if not exists (
    select 1
    from public.lounge_bot_accounts a
    where a.slug = v_slug
      and a.pipeline = 'odds_api'
      and a.enabled = true
  ) then
    raise exception 'odds bot not found: %', v_slug;
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
    raise exception 'missing vault secret lounge_odds_poll_service_role_key';
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise exception 'missing vault secret lounge_odds_poll_project_url';
  end if;

  if service_key ~* '^bearer\s+' then
    service_key := btrim(regexp_replace(service_key, '^[Bb]earer\s+', ''));
  end if;

  base_url := rtrim(btrim(base_url), '/');

  body := jsonb_build_object(
    'slug', v_slug,
    'action', v_action,
    'dryRun', coalesce(p_dry_run, false),
    'force', coalesce(p_force, false)
  );

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

  return jsonb_build_object(
    'ok', true,
    'queued', true,
    'requestId', req_id,
    'slug', v_slug,
    'action', v_action
  );
end;
$$;

-- Every 5 min, 10am-2am PT (PDT UTC-7): hours 17-23 + 0-8 UTC covers 10am PT through ~1am PT next day.
do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_odds_poll_live'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_odds_poll_live',
  '*/5 17-23,0-8 * * *',
  $$select public.invoke_lounge_odds_poll('poll_live');$$
);
