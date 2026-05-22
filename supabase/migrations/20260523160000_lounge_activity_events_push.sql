-- Phase H2 — enqueue Lounge activity web push on activity_events INSERT (pg_net → Edge).
-- Prereqs: pg_net extension; Edge `lounge-send-activity-push` deployed with LOUNGE_ACTIVITY_PUSH_SECRET.
-- Vault (once per project):
--   lounge_activity_push_http_secret  → same value as Edge LOUNGE_ACTIVITY_PUSH_SECRET
--   lounge_activity_push_project_url  → https://YOUR_PROJECT_REF.supabase.co
--   lounge_activity_push_supabase_anon_key → legacy JWT anon public key (eyJ…)

create or replace function public.activity_events_enqueue_push()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net, extensions, pg_temp
as $$
declare
  push_secret text;
  anon_key text;
  base_url text;
  req_id bigint;
begin
  select ds.decrypted_secret
  into push_secret
  from vault.decrypted_secrets as ds
  where ds.name = 'lounge_activity_push_http_secret'
  limit 1;

  select ds.decrypted_secret
  into anon_key
  from vault.decrypted_secrets as ds
  where ds.name = 'lounge_activity_push_supabase_anon_key'
  limit 1;

  select ds.decrypted_secret
  into base_url
  from vault.decrypted_secrets as ds
  where ds.name = 'lounge_activity_push_project_url'
  limit 1;

  if push_secret is null or btrim(push_secret) = '' then
    raise warning 'activity_events_enqueue_push: add vault secret lounge_activity_push_http_secret';
    return new;
  end if;

  if anon_key is null or btrim(anon_key) = '' then
    raise warning 'activity_events_enqueue_push: add vault secret lounge_activity_push_supabase_anon_key';
    return new;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'activity_events_enqueue_push: add vault secret lounge_activity_push_project_url';
    return new;
  end if;

  base_url := rtrim(btrim(base_url), '/');

  select
    net.http_post(
      url := base_url || '/functions/v1/lounge-send-activity-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', anon_key,
        'Authorization', 'Bearer ' || anon_key,
        'x-lounge-activity-push-secret', push_secret
      ),
      body := jsonb_build_object('activityEventId', new.id),
      timeout_milliseconds := 15000
    )
  into req_id;

  return new;
exception
  when others then
    raise warning 'activity_events_enqueue_push: %', sqlerrm;
    return new;
end;
$$;

comment on function public.activity_events_enqueue_push() is
  'Best-effort pg_net POST to lounge-send-activity-push; warnings only on failure.';

drop trigger if exists trg_activity_events_enqueue_push on public.activity_events;
create trigger trg_activity_events_enqueue_push
  after insert on public.activity_events
  for each row
  execute function public.activity_events_enqueue_push();
