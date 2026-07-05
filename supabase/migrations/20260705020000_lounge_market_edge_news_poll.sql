-- Market Edge financial news bot — pg_cron poll + seed/watchlist helpers.
--
-- Persona: slug market-edge, handle marketedge, pipeline market_news.
-- Prereqs: pg_cron + pg_net; Vault secrets lounge_odds_poll_project_url + lounge_odds_poll_service_role_key
--   (same as sports odds cron — one service role + project URL per Supabase project).
-- Edge: deploy lounge-news-poll + FINNHUB_API_KEY before expecting posts.
--
-- Manual smoke:
--   select public.invoke_lounge_news_poll();
--   select public.lounge_bot_seed_market_news_sources('<BOT_USER_UUID>'::uuid);

-- ---------------------------------------------------------------------------
-- Seed Finnhub sources (general + M&A + watchlist company feeds)
-- ---------------------------------------------------------------------------

create or replace function public.lounge_bot_seed_market_news_sources(p_bot_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_watchlist jsonb;
  v_ticker text;
begin
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  select a.slug, coalesce(a.config, '{}'::jsonb)
  into v_slug, v_watchlist
  from public.lounge_bot_accounts a
  where a.user_id = p_bot_user_id
    and a.pipeline = 'market_news'
  limit 1;

  if v_slug is null then
    raise exception 'lounge_bot_accounts row with pipeline=market_news required for %', p_bot_user_id;
  end if;

  insert into public.lounge_news_sources (bot_user_id, name, kind, api_config, poll_interval_sec, enabled)
  select p_bot_user_id, v.name, v.kind, v.api_config, v.poll_interval_sec, true
  from (
    values
      ('Finnhub general market', 'finnhub_general', '{"category":"general"}'::jsonb, 180),
      ('Finnhub M&A', 'finnhub_category', '{"category":"merger"}'::jsonb, 300),
      ('Finnhub forex / macro', 'finnhub_category', '{"category":"forex"}'::jsonb, 300),
      ('Finnhub crypto', 'finnhub_category', '{"category":"crypto"}'::jsonb, 300)
  ) as v(name, kind, api_config, poll_interval_sec)
  where not exists (
    select 1 from public.lounge_news_sources s
    where s.bot_user_id = p_bot_user_id and s.name = v.name
  );

  for v_ticker in
    select distinct upper(btrim(jsonb_array_elements_text(coalesce(v_watchlist->'watchlist_tickers', '[]'::jsonb))))
  loop
    if v_ticker is null or v_ticker = '' then
      continue;
    end if;
    insert into public.lounge_news_sources (bot_user_id, name, kind, api_config, poll_interval_sec, enabled)
    select
      p_bot_user_id,
      'Finnhub ' || v_ticker,
      'finnhub_company',
      jsonb_build_object('symbol', v_ticker),
      600,
      true
    where not exists (
      select 1
      from public.lounge_news_sources s
      where s.bot_user_id = p_bot_user_id
        and s.kind = 'finnhub_company'
        and upper(coalesce(s.api_config->>'symbol', '')) = v_ticker
    );
  end loop;
end;
$$;

revoke all on function public.lounge_bot_seed_market_news_sources(uuid) from public;
grant execute on function public.lounge_bot_seed_market_news_sources(uuid) to authenticated;

comment on function public.lounge_bot_seed_market_news_sources(uuid) is
  'Admin: insert default Finnhub sources for a market_news bot (general, M&A, watchlist company feeds).';

-- Back-compat alias
create or replace function public.lounge_bot_seed_financial_wire_sources(p_bot_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.lounge_bot_seed_market_news_sources(p_bot_user_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- pg_cron → lounge-news-poll (every 3 min, running market_news bots only)
-- ---------------------------------------------------------------------------

create or replace function public.invoke_lounge_news_poll()
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
  body jsonb;
begin
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
    raise warning 'invoke_lounge_news_poll: add vault secret lounge_odds_poll_service_role_key (service_role JWT)';
    return;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'invoke_lounge_news_poll: add vault secret lounge_odds_poll_project_url';
    return;
  end if;

  if service_key ~* '^bearer\s+' then
    service_key := btrim(regexp_replace(service_key, '^[Bb]earer\s+', ''));
  end if;

  base_url := rtrim(btrim(base_url), '/');

  for bot in
    select a.slug
    from public.lounge_bot_accounts a
    where a.pipeline = 'market_news'
      and a.run_state = 'running'
      and a.enabled = true
    order by a.slug
  loop
    body := jsonb_build_object('slug', bot.slug);

    begin
      select
        net.http_post(
          url := base_url || '/functions/v1/lounge-news-poll',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', service_key,
            'Authorization', 'Bearer ' || service_key
          ),
          body := body,
          timeout_milliseconds := 120000
        )
      into req_id;
    exception
      when others then
        raise warning 'invoke_lounge_news_poll: bot % — %', bot.slug, sqlerrm;
    end;
  end loop;
exception
  when others then
    raise warning 'invoke_lounge_news_poll: %', sqlerrm;
end;
$$;

comment on function public.invoke_lounge_news_poll() is
  'pg_cron helper: POST lounge-news-poll for each running market_news bot.';

do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_news_poll_market_edge'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_news_poll_market_edge',
  '*/3 * * * *',
  $$select public.invoke_lounge_news_poll();$$
);

-- ---------------------------------------------------------------------------
-- Edge Monitor ops snapshot — first market_news bot (Market Edge)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_ops_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_portal jsonb;
  v_bot jsonb;
begin
  v_portal := public.admin_lounge_bot_portal_snapshot();
  select elem into v_bot
  from jsonb_array_elements(coalesce(v_portal->'bots', '[]'::jsonb)) elem
  where elem->>'pipeline' = 'market_news'
  order by elem->>'slug'
  limit 1;

  return jsonb_build_object(
    'generated_at', v_portal->'generated_at',
    'market_news', case
      when v_bot is null then jsonb_build_object('configured', false)
      else jsonb_build_object(
        'configured', true,
        'slug', v_bot->'slug',
        'user_id', v_bot->'user_id',
        'enabled', v_bot->'enabled',
        'run_state', v_bot->'run_state',
        'display_name', v_bot->'display_name',
        'last_poll_at', v_bot->'last_poll_at',
        'last_publish_at', v_bot->'last_publish_at',
        'max_posts_per_day', v_bot->'max_posts_per_day',
        'max_posts_per_hour', v_bot->'max_posts_per_hour',
        'publish_score_threshold', v_bot->'publish_score_threshold',
        'posts_today', v_bot->'posts_today',
        'posts_last_hour', v_bot->'posts_last_hour',
        'sources_enabled', (
          select count(*)::int
          from jsonb_array_elements(coalesce(v_bot->'sources', '[]'::jsonb)) s
          where (s->>'enabled')::boolean = true
        ),
        'recent_publishes', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l->>'id',
            'caption', l->>'caption',
            'score', l->>'score',
            'post_id', l->>'post_id',
            'created_at', l->>'created_at'
          ))
          from jsonb_array_elements(coalesce(v_bot->'recent_log', '[]'::jsonb)) l
          where l->>'status' = 'published'
        ), '[]'::jsonb),
        'recent_errors', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l->>'id',
            'error_message', l->>'error_message',
            'created_at', l->>'created_at'
          ))
          from jsonb_array_elements(coalesce(v_bot->'recent_log', '[]'::jsonb)) l
          where l->>'status' = 'failed'
        ), '[]'::jsonb)
      )
    end,
    -- Legacy key for older clients
    'financial_wire', case
      when v_bot is null then jsonb_build_object('configured', false)
      else jsonb_build_object(
        'configured', true,
        'slug', v_bot->'slug',
        'user_id', v_bot->'user_id',
        'enabled', v_bot->'enabled',
        'run_state', v_bot->'run_state',
        'display_name', v_bot->'display_name',
        'last_poll_at', v_bot->'last_poll_at',
        'last_publish_at', v_bot->'last_publish_at',
        'max_posts_per_day', v_bot->'max_posts_per_day',
        'max_posts_per_hour', v_bot->'max_posts_per_hour',
        'publish_score_threshold', v_bot->'publish_score_threshold',
        'posts_today', v_bot->'posts_today',
        'posts_last_hour', v_bot->'posts_last_hour',
        'sources_enabled', (
          select count(*)::int
          from jsonb_array_elements(coalesce(v_bot->'sources', '[]'::jsonb)) s
          where (s->>'enabled')::boolean = true
        ),
        'recent_publishes', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l->>'id',
            'caption', l->>'caption',
            'score', l->>'score',
            'post_id', l->>'post_id',
            'created_at', l->>'created_at'
          ))
          from jsonb_array_elements(coalesce(v_bot->'recent_log', '[]'::jsonb)) l
          where l->>'status' = 'published'
        ), '[]'::jsonb),
        'recent_errors', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l->>'id',
            'error_message', l->>'error_message',
            'created_at', l->>'created_at'
          ))
          from jsonb_array_elements(coalesce(v_bot->'recent_log', '[]'::jsonb)) l
          where l->>'status' = 'failed'
        ), '[]'::jsonb)
      )
    end
  );
end;
$$;
