-- Phase H3 — batched like/bookmark push (10s debounce), per-type notification_preferences.
-- Replaces immediate push for like/bookmark; immediate types unchanged.
-- Prereqs: pg_cron + pg_net; Edge lounge-send-activity-push (batchId body); Vault push secrets.

-- ---------------------------------------------------------------------------
-- 1) Per-user push category preferences (defaults all on)
-- ---------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  push_replies boolean not null default true,
  push_mentions boolean not null default true,
  push_follows boolean not null default true,
  push_reposts boolean not null default true,
  push_likes boolean not null default true,
  push_bookmarks boolean not null default true,
  push_messages boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is
  'Lounge push category opt-in/out per account. Master device toggle remains push_subscriptions + localStorage.';

create or replace function public.set_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_notification_preferences_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own on public.notification_preferences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own on public.notification_preferences
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own on public.notification_preferences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.notification_preferences to authenticated;

create or replace function public.lounge_push_pref_allows(p_prefs public.notification_preferences, p_event_type text)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_prefs is null then
    return true;
  end if;
  case p_event_type
    when 'comment_on_post', 'reply_to_comment' then return p_prefs.push_replies;
    when 'mention_in_post', 'mention_in_comment' then return p_prefs.push_mentions;
    when 'follow' then return p_prefs.push_follows;
    when 'repost', 'quote_repost' then return p_prefs.push_reposts;
    when 'like' then return p_prefs.push_likes;
    when 'bookmark' then return p_prefs.push_bookmarks;
    else return true;
  end case;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Debounced batch outbox (like/bookmark only — 10s low-traffic default)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_push_batches (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('like', 'bookmark')),
  post_id uuid,
  comment_id uuid,
  batch_key text not null,
  scheduled_send_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activity_push_batches_due_idx
  on public.activity_push_batches (scheduled_send_at)
  where sent_at is null;

create unique index if not exists activity_push_batches_open_unique
  on public.activity_push_batches (recipient_user_id, batch_key)
  where sent_at is null;

create table if not exists public.activity_push_batch_events (
  batch_id uuid not null references public.activity_push_batches (id) on delete cascade,
  activity_event_id uuid not null references public.activity_events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (batch_id, activity_event_id)
);

comment on table public.activity_push_batches is
  'Pending grouped like/bookmark web push; scheduled_send_at resets on each new event in the batch (10s debounce).';

-- ---------------------------------------------------------------------------
-- 3) Shared Edge invoke helper
-- ---------------------------------------------------------------------------
create or replace function public.activity_push_invoke_lounge_edge(p_body jsonb)
returns void
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
    raise warning 'activity_push_invoke_lounge_edge: add vault secret lounge_activity_push_http_secret';
    return;
  end if;

  if anon_key is null or btrim(anon_key) = '' then
    raise warning 'activity_push_invoke_lounge_edge: add vault secret lounge_activity_push_supabase_anon_key';
    return;
  end if;

  if base_url is null or btrim(base_url) = '' then
    raise warning 'activity_push_invoke_lounge_edge: add vault secret lounge_activity_push_project_url';
    return;
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
      body := coalesce(p_body, '{}'::jsonb),
      timeout_milliseconds := 15000
    )
  into req_id;
exception
  when others then
    raise warning 'activity_push_invoke_lounge_edge: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Schedule like/bookmark into batch (10 second debounce)
-- ---------------------------------------------------------------------------
create or replace function public.activity_push_schedule_batch(p_event public.activity_events)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_key text;
  v_batch_id uuid;
  v_debounce interval := interval '10 seconds';
begin
  if p_event.event_type not in ('like', 'bookmark') then
    return;
  end if;

  v_batch_key :=
    p_event.event_type || ':' ||
    coalesce(p_event.post_id::text, '') || ':' ||
    coalesce(p_event.comment_id::text, '');

  select b.id
  into v_batch_id
  from public.activity_push_batches b
  where b.recipient_user_id = p_event.recipient_user_id
    and b.batch_key = v_batch_key
    and b.sent_at is null
  for update;

  if v_batch_id is not null then
    update public.activity_push_batches
    set scheduled_send_at = now() + v_debounce,
        updated_at = now()
    where id = v_batch_id;
  else
    insert into public.activity_push_batches (
      recipient_user_id,
      event_type,
      post_id,
      comment_id,
      batch_key,
      scheduled_send_at
    )
    values (
      p_event.recipient_user_id,
      p_event.event_type,
      p_event.post_id,
      p_event.comment_id,
      v_batch_key,
      now() + v_debounce
    )
    returning id into v_batch_id;
  end if;

  insert into public.activity_push_batch_events (batch_id, activity_event_id)
  values (v_batch_id, p_event.id)
  on conflict do nothing;
exception
  when others then
    raise warning 'activity_push_schedule_batch: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Flush due batches (pg_cron every 10s)
-- ---------------------------------------------------------------------------
create or replace function public.activity_push_flush_due_batches()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
begin
  for v_batch_id in
    select b.id
    from public.activity_push_batches b
    where b.sent_at is null
      and b.scheduled_send_at <= now()
    order by b.scheduled_send_at asc
    limit 25
  loop
    perform public.activity_push_invoke_lounge_edge(
      jsonb_build_object('batchId', v_batch_id)
    );
  end loop;
exception
  when others then
    raise warning 'activity_push_flush_due_batches: %', sqlerrm;
end;
$$;

comment on function public.activity_push_flush_due_batches() is
  'Invokes lounge-send-activity-push for each due like/bookmark batch. Cron: every 10 seconds.';

-- ---------------------------------------------------------------------------
-- 6) Route activity_events INSERT — immediate vs batched
-- ---------------------------------------------------------------------------
create or replace function public.activity_events_enqueue_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_type in ('like', 'bookmark') then
    perform public.activity_push_schedule_batch(new);
  else
    perform public.activity_push_invoke_lounge_edge(
      jsonb_build_object('activityEventId', new.id)
    );
  end if;
  return new;
exception
  when others then
    raise warning 'activity_events_enqueue_push: %', sqlerrm;
    return new;
end;
$$;

comment on function public.activity_events_enqueue_push() is
  'Like/bookmark → 10s debounced batch; other types → immediate Edge push.';

-- Trigger already exists from H2 migration; function body replaced above.

-- ---------------------------------------------------------------------------
-- 7) pg_cron flush job (10 seconds)
-- ---------------------------------------------------------------------------
do $$
declare
  jid int;
begin
  for jid in select jobid from cron.job where jobname = 'lounge_activity_push_flush'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'lounge_activity_push_flush',
  '10 seconds',
  $$select public.activity_push_flush_due_batches();$$
);
