-- Manual one-shot: top ~2000 crypto → market_instruments (CoinGecko markets + batch upsert).
-- Reuses Vault secrets from lounge odds cron.
--
-- Smoke after Edge deploy:
--   select public.invoke_lounge_market_crypto_backfill(8);
-- Verify:
--   select count(*) from market_instruments where asset_class = 'crypto';
--   select count(*) from market_instruments where asset_class = 'crypto' and btrim(logo_url) <> '';

create or replace function public.invoke_lounge_market_crypto_backfill(p_max_pages int default 8)
returns void
language plpgsql
security definer
set search_path = public, vault, net, cron, extensions, pg_temp
as $$
declare
  service_key text;
  base_url text;
  req_id bigint;
  pages int;
begin
  pages := greatest(1, least(8, coalesce(p_max_pages, 8)));

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
    raise warning 'invoke_lounge_market_crypto_backfill: add vault secret lounge_odds_poll_service_role_key';
    return;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'invoke_lounge_market_crypto_backfill: add vault secret lounge_odds_poll_project_url';
    return;
  end if;

  if service_key ~* '^bearer\s+' then
    service_key := btrim(regexp_replace(service_key, '^[Bb]earer\s+', ''));
  end if;

  base_url := rtrim(btrim(base_url), '/');

  select
    net.http_post(
      url := base_url || '/functions/v1/lounge-market-symbol-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', service_key,
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('crypto_only', true, 'max_pages', pages),
      timeout_milliseconds := 300000
    )
  into req_id;
exception
  when others then
    raise warning 'invoke_lounge_market_crypto_backfill: %', sqlerrm;
end;
$$;

comment on function public.invoke_lounge_market_crypto_backfill(int) is
  'Manual: POST lounge-market-symbol-sync crypto backfill (top 250*pages CoinGecko markets, batch upsert).';

revoke all on function public.invoke_lounge_market_crypto_backfill(int) from public;
grant execute on function public.invoke_lounge_market_crypto_backfill(int) to postgres;
