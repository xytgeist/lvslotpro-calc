-- Market Edge: SEC EDGAR + allowlisted RSS source kinds.
-- Backfill default sources for existing market_news bots (idempotent by source name).

alter table public.lounge_news_sources
  drop constraint if exists lounge_news_sources_kind_check;

alter table public.lounge_news_sources
  add constraint lounge_news_sources_kind_check
  check (kind in ('finnhub_general', 'finnhub_category', 'finnhub_company', 'rss', 'edgar'));

comment on column public.lounge_news_sources.kind is
  'finnhub_* = Finnhub API; rss = allowlisted RSS/Atom URL; edgar = SEC EDGAR current filings Atom.';

-- ---------------------------------------------------------------------------
-- Seed all default Market Edge sources (Finnhub + EDGAR + gov RSS + BBC/NPR)
-- ---------------------------------------------------------------------------

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

  insert into public.lounge_news_sources (bot_user_id, name, kind, poll_url, api_config, poll_interval_sec, enabled)
  select p_bot_user_id, v.name, v.kind, v.poll_url, v.api_config, v.poll_interval_sec, true
  from (
    values
      ('Finnhub general market', 'finnhub_general', null::text, '{"category":"general"}'::jsonb, 180),
      ('Finnhub M&A', 'finnhub_category', null::text, '{"category":"merger"}'::jsonb, 300),
      ('Finnhub forex / macro', 'finnhub_category', null::text, '{"category":"forex"}'::jsonb, 300),
      ('Finnhub crypto', 'finnhub_category', null::text, '{"category":"crypto"}'::jsonb, 300),
      ('SEC EDGAR 8-K', 'edgar', null::text, '{"filing_type":"8-K","count":40}'::jsonb, 180),
      ('SEC EDGAR 10-Q', 'edgar', null::text, '{"filing_type":"10-Q","count":30}'::jsonb, 600),
      ('SEC EDGAR 10-K', 'edgar', null::text, '{"filing_type":"10-K","count":30}'::jsonb, 900),
      ('SEC press releases', 'rss', 'https://www.sec.gov/news/pressreleases.rss', '{"source_label":"SEC"}'::jsonb, 300),
      ('Federal Reserve press', 'rss', 'https://www.federalreserve.gov/feeds/press_all.xml', '{"source_label":"Federal Reserve"}'::jsonb, 300),
      ('US Treasury press', 'rss', 'https://home.treasury.gov/system/files/136/TreasuryPressReleases.xml', '{"source_label":"US Treasury"}'::jsonb, 420),
      ('CFTC press releases', 'rss', 'https://www.cftc.gov/PressRoom/PressReleases/rss.xml', '{"source_label":"CFTC"}'::jsonb, 420),
      ('EIA Today in Energy', 'rss', 'https://www.eia.gov/rss/todayinenergy.xml', '{"source_label":"EIA"}'::jsonb, 600),
      ('BBC Business', 'rss', 'https://feeds.bbci.co.uk/news/business/rss.xml', '{"source_label":"BBC Business"}'::jsonb, 300),
      ('NPR Business', 'rss', 'https://feeds.npr.org/1001/rss.xml', '{"source_label":"NPR Business"}'::jsonb, 420)
  ) as v(name, kind, poll_url, api_config, poll_interval_sec)
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

-- Backfill default rows for existing market_news bots (idempotent)
insert into public.lounge_news_sources (bot_user_id, name, kind, poll_url, api_config, poll_interval_sec, enabled)
select a.user_id, v.name, v.kind, v.poll_url, v.api_config, v.poll_interval_sec, true
from public.lounge_bot_accounts a
cross join (
  values
    ('Finnhub general market', 'finnhub_general', null::text, '{"category":"general"}'::jsonb, 180),
    ('Finnhub M&A', 'finnhub_category', null::text, '{"category":"merger"}'::jsonb, 300),
    ('Finnhub forex / macro', 'finnhub_category', null::text, '{"category":"forex"}'::jsonb, 300),
    ('Finnhub crypto', 'finnhub_category', null::text, '{"category":"crypto"}'::jsonb, 300),
    ('SEC EDGAR 8-K', 'edgar', null::text, '{"filing_type":"8-K","count":40}'::jsonb, 180),
    ('SEC EDGAR 10-Q', 'edgar', null::text, '{"filing_type":"10-Q","count":30}'::jsonb, 600),
    ('SEC EDGAR 10-K', 'edgar', null::text, '{"filing_type":"10-K","count":30}'::jsonb, 900),
    ('SEC press releases', 'rss', 'https://www.sec.gov/news/pressreleases.rss', '{"source_label":"SEC"}'::jsonb, 300),
    ('Federal Reserve press', 'rss', 'https://www.federalreserve.gov/feeds/press_all.xml', '{"source_label":"Federal Reserve"}'::jsonb, 300),
    ('US Treasury press', 'rss', 'https://home.treasury.gov/system/files/136/TreasuryPressReleases.xml', '{"source_label":"US Treasury"}'::jsonb, 420),
    ('CFTC press releases', 'rss', 'https://www.cftc.gov/PressRoom/PressReleases/rss.xml', '{"source_label":"CFTC"}'::jsonb, 420),
    ('EIA Today in Energy', 'rss', 'https://www.eia.gov/rss/todayinenergy.xml', '{"source_label":"EIA"}'::jsonb, 600),
    ('BBC Business', 'rss', 'https://feeds.bbci.co.uk/news/business/rss.xml', '{"source_label":"BBC Business"}'::jsonb, 300),
    ('NPR Business', 'rss', 'https://feeds.npr.org/1001/rss.xml', '{"source_label":"NPR Business"}'::jsonb, 420)
) as v(name, kind, poll_url, api_config, poll_interval_sec)
where a.pipeline = 'market_news'
  and not exists (
    select 1 from public.lounge_news_sources s
    where s.bot_user_id = a.user_id and s.name = v.name
  );
