-- X editorial bots — pg_cron poll every 8 hours (all running pipeline=x bots in one Edge call).
--
-- Prereqs: pg_cron + pg_net; Vault secrets lounge_odds_poll_project_url + lounge_odds_poll_service_role_key
--   (same as sports odds / Market Edge news poll).
-- Edge: deploy lounge-x-ingest + X_API_BEARER_TOKEN + OPENAI_API_KEY before expecting inbox drafts.
--
-- First poll per @handle seeds since_id only (no historical backfill) — see lounge-x-ingest.
--
-- Manual smoke:
--   select public.invoke_lounge_x_ingest();
--   select jobname, schedule from cron.job where jobname = 'lounge_x_ingest_editorial';

create or replace function public.invoke_lounge_x_ingest()
returns void
language plpgsql
security definer
set search_path = public, vault, net, cron, extensions, pg_temp
as $$
declare
  service_key text;
  base_url text;
  req_id bigint;
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
    raise warning 'invoke_lounge_x_ingest: add vault secret lounge_odds_poll_service_role_key (service_role JWT)';
    return;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'invoke_lounge_x_ingest: add vault secret lounge_odds_poll_project_url';
    return;
  end if;

  if service_key ~* '^bearer\s+' then
    service_key := btrim(regexp_replace(service_key, '^[Bb]earer\s+', ''));
  end if;

  base_url := rtrim(btrim(base_url), '/');

  begin
    select
      net.http_post(
        url := base_url || '/functions/v1/lounge-x-ingest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', service_key,
          'Authorization', 'Bearer ' || service_key
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
      )
    into req_id;
  exception
    when others then
      raise warning 'invoke_lounge_x_ingest: %', sqlerrm;
  end;
exception
  when others then
    raise warning 'invoke_lounge_x_ingest: %', sqlerrm;
end;
$$;

comment on function public.invoke_lounge_x_ingest() is
  'pg_cron helper: POST lounge-x-ingest for all running X-tracker bots (no slug — one call, N bots).';

revoke all on function public.invoke_lounge_x_ingest() from public;
grant execute on function public.invoke_lounge_x_ingest() to postgres;

do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_x_ingest_editorial'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

-- Every 8 hours at :00 UTC (00:00, 08:00, 16:00 UTC ≈ 5pm / 1am / 9am PT during PDT).
select cron.schedule(
  'lounge_x_ingest_editorial',
  '0 */8 * * *',
  $$select public.invoke_lounge_x_ingest();$$
);
