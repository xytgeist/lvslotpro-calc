-- Bot portal: queue lounge-odds-poll via pg_net (returns immediately; avoids client invoke timeout).
-- Cron already uses invoke_lounge_odds_poll(); portal uses admin RPC with slug + force/dryRun.

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
  action text;
  body jsonb;
  slug text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  slug := btrim(coalesce(p_slug, ''));
  if slug = '' then
    raise exception 'slug required';
  end if;

  action := lower(btrim(coalesce(p_action, '')));
  if action not in ('poll_edges', 'daily_slates', 'best_bet_hour', 'value_bet_radar') then
    raise exception 'invalid action: %', p_action;
  end if;

  if not exists (
    select 1
    from public.lounge_bot_accounts a
    where a.slug = slug
      and a.pipeline = 'odds_api'
      and a.enabled = true
  ) then
    raise exception 'odds bot not found: %', slug;
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
    'slug', slug,
    'action', action,
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
    'asyncQueued', true,
    'request_id', req_id,
    'slug', slug,
    'action', action
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;

comment on function public.admin_lounge_bot_queue_odds_poll(text, text, boolean, boolean) is
  'Admin portal: async POST lounge-odds-poll for one odds bot (pg_net, 180s worker timeout).';

revoke all on function public.admin_lounge_bot_queue_odds_poll(text, text, boolean, boolean) from public;
grant execute on function public.admin_lounge_bot_queue_odds_poll(text, text, boolean, boolean) to authenticated;
