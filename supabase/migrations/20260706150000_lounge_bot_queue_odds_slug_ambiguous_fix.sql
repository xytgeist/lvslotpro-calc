-- Fix: PL/pgSQL variable `slug` collides with lounge_bot_accounts.slug in SQL (ambiguous column reference).

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
  if v_action not in ('poll_edges', 'daily_slates', 'best_bet_hour', 'value_bet_radar') then
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
    'asyncQueued', true,
    'request_id', req_id,
    'slug', v_slug,
    'action', v_action
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;

create or replace function public.admin_lounge_bot_queue_odds_ingest(
  p_slug text,
  p_sport_key text default null,
  p_calendar_slug text default null,
  p_post_mode text default 'edge_only',
  p_action text default null
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
  body jsonb;
  v_slug text;
  v_action text;
  v_sport_key text;
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
  v_sport_key := btrim(coalesce(p_sport_key, ''));

  if v_action = 'publish_examples' then
    body := jsonb_build_object('slug', v_slug, 'action', 'publish_examples');
  else
    if v_sport_key = '' then
      raise exception 'sport_key required';
    end if;
    body := jsonb_build_object(
      'slug', v_slug,
      'sportKey', v_sport_key,
      'calendarSlug', nullif(btrim(coalesce(p_calendar_slug, '')), ''),
      'postMode', coalesce(nullif(btrim(coalesce(p_post_mode, '')), ''), 'edge_only'),
      'dryRun', false
    );
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

  select
    net.http_post(
      url := base_url || '/functions/v1/lounge-odds-ingest',
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
    'slug', v_slug,
    'action', coalesce(nullif(v_action, ''), 'fetch_odds'),
    'sportKey', nullif(v_sport_key, '')
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;
