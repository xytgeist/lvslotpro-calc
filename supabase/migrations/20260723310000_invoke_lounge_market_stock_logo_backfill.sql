-- Manual batch: Yahoo logos for stocks with empty logo_url (default 50 per run).
--
-- Repeat with returned next_after_cache_key until remaining_without_logo is 0:
--   select public.invoke_lounge_market_stock_logo_backfill(50, 'stock:zzzzz');
--
-- First batch:
--   select public.invoke_lounge_market_stock_logo_backfill(50, null);

create or replace function public.invoke_lounge_market_stock_logo_backfill(
  p_limit int default 50,
  p_after_cache_key text default null
)
returns void
language plpgsql
security definer
set search_path = public, vault, net, cron, extensions, pg_temp
as $$
declare
  service_key text;
  base_url text;
  req_id bigint;
  lim int;
  after_key text;
begin
  lim := greatest(1, least(200, coalesce(p_limit, 50)));
  after_key := nullif(btrim(coalesce(p_after_cache_key, '')), '');

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
    raise warning 'invoke_lounge_market_stock_logo_backfill: add vault secret lounge_odds_poll_service_role_key';
    return;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'invoke_lounge_market_stock_logo_backfill: add vault secret lounge_odds_poll_project_url';
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
      body := jsonb_build_object(
        'stock_logo_batch', true,
        'limit', lim
      ) || case
        when after_key is not null then jsonb_build_object('after_cache_key', after_key)
        else '{}'::jsonb
      end,
      timeout_milliseconds := 300000
    )
  into req_id;
exception
  when others then
    raise warning 'invoke_lounge_market_stock_logo_backfill: %', sqlerrm;
end;
$$;

comment on function public.invoke_lounge_market_stock_logo_backfill(int, text) is
  'Manual: POST lounge-market-symbol-sync stock_logo_batch (Yahoo logos, default 50). Pass prior next_after_cache_key as p_after_cache_key.';

revoke all on function public.invoke_lounge_market_stock_logo_backfill(int, text) from public;
grant execute on function public.invoke_lounge_market_stock_logo_backfill(int, text) to postgres;
