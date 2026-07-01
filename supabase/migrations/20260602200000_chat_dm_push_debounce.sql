-- Debounce DM web push (60s per recipient + room) so message bursts collapse to one notification.
-- Reuses activity_push_batches + pg_cron flush (H3). Redeploy lounge-send-activity-push for batched DM copy.

begin;

alter table public.activity_push_batches
  drop constraint if exists activity_push_batches_event_type_check;

alter table public.activity_push_batches
  add constraint activity_push_batches_event_type_check
  check (event_type in ('like', 'bookmark', 'chat_dm'));

alter table public.activity_push_batches
  add column if not exists chat_room_id uuid
    references public.chat_rooms (id) on delete cascade;

comment on column public.activity_push_batches.chat_room_id is
  'DM batch: groups pushes per conversation (chat_room_id). Null for like/bookmark batches.';

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
    when 'chat_dm' then return p_prefs.push_messages;
    else return true;
  end case;
end;
$$;

create or replace function public.activity_push_schedule_batch(p_event public.activity_events)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_key text;
  v_batch_id uuid;
  v_debounce interval;
begin
  if p_event.event_type not in ('like', 'bookmark', 'chat_dm') then
    return;
  end if;

  v_debounce := case
    when p_event.event_type = 'chat_dm' then interval '60 seconds'
    else interval '10 seconds'
  end;

  if p_event.event_type = 'chat_dm' then
    if p_event.chat_room_id is null then
      return;
    end if;
    v_batch_key := 'chat_dm:' || p_event.chat_room_id::text;
  else
    v_batch_key :=
      p_event.event_type || ':' ||
      coalesce(p_event.post_id::text, '') || ':' ||
      coalesce(p_event.comment_id::text, '');
  end if;

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
      chat_room_id,
      batch_key,
      scheduled_send_at
    )
    values (
      p_event.recipient_user_id,
      p_event.event_type,
      p_event.post_id,
      p_event.comment_id,
      case when p_event.event_type = 'chat_dm' then p_event.chat_room_id else null end,
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

comment on function public.activity_push_schedule_batch(public.activity_events) is
  'Like/bookmark: batch per post/comment (10s debounce). chat_dm: batch per room (60s debounce, timer resets on each message).';

create or replace function public.activity_events_enqueue_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_type in ('like', 'bookmark', 'chat_dm') then
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
  'Like/bookmark → 10s batch; chat_dm → 60s batch per room; other types → immediate Edge push.';

commit;
