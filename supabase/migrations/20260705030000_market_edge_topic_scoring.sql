-- Market Edge topic scoring — broaden Finnhub sources (forex + crypto), no default ticker watchlist.

create or replace function public.lounge_bot_seed_market_news_sources(p_bot_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_watchlist jsonb;
  v_ticker text;
begin
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  if not exists (
    select 1 from public.lounge_bot_accounts a
    where a.user_id = p_bot_user_id and a.pipeline = 'market_news'
  ) then
    raise exception 'lounge_bot_accounts row with pipeline=market_news required for %', p_bot_user_id;
  end if;

  select coalesce(a.config, '{}'::jsonb)
  into v_watchlist
  from public.lounge_bot_accounts a
  where a.user_id = p_bot_user_id;

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

comment on function public.lounge_bot_seed_market_news_sources(uuid) is
  'Admin: Finnhub general/M&A/forex/crypto sources for market_news bots; optional watchlist_tickers add company feeds.';
