-- Feed comment activity_events still missing after 20260607200000 on some projects:
-- SECURITY DEFINER trigger can hit RLS on community_feed_posts / activity_events
-- when function owner is not table owner → v_post_owner NULL → insert_safe no-ops.
-- Fix: row_security off + direct guarded insert with warnings.

create or replace function public.activity_events_on_feed_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_post_owner uuid;
  v_parent_owner uuid;
  v_primary_recipient uuid;
  v_recipient uuid;
  v_event_type text;
begin
  if new.hidden_at is not null then
    return new;
  end if;

  select cfp.user_id
    into v_post_owner
  from public.community_feed_posts cfp
  where cfp.id = new.post_id;

  if v_post_owner is null then
    raise warning 'activity_events_on_feed_comment_insert: post % not found', new.post_id;
    return new;
  end if;

  if new.parent_id is null then
    v_recipient := v_post_owner;
    v_event_type := 'comment_on_post';
    v_primary_recipient := v_post_owner;
  else
    select fc.user_id
      into v_parent_owner
    from public.feed_comments fc
    where fc.id = new.parent_id;

    if v_parent_owner is null then
      raise warning 'activity_events_on_feed_comment_insert: parent comment % not found', new.parent_id;
      return new;
    end if;

    v_recipient := v_parent_owner;
    v_event_type := 'reply_to_comment';
    v_primary_recipient := v_parent_owner;
  end if;

  if v_recipient is distinct from new.user_id then
    begin
      insert into public.activity_events (
        recipient_user_id,
        actor_user_id,
        event_type,
        post_id,
        comment_id
      )
      values (
        v_recipient,
        new.user_id,
        v_event_type,
        new.post_id,
        new.id
      );
    exception
      when others then
        raise warning 'activity_events_on_feed_comment_insert insert: %', sqlerrm;
    end;
  end if;

  perform public.activity_events_emit_mentions(
    new.user_id,
    new.body,
    'mention_in_comment',
    new.post_id,
    new.id,
    v_primary_recipient
  );

  return new;
exception
  when others then
    raise warning 'activity_events_on_feed_comment_insert: %', sqlerrm;
    return new;
end;
$$;

comment on function public.activity_events_on_feed_comment_insert() is
  'After feed_comments INSERT: comment_on_post / reply_to_comment (+ mentions). row_security off for RLS-safe post lookup.';

drop trigger if exists trg_activity_events_feed_comment_insert on public.feed_comments;
create trigger trg_activity_events_feed_comment_insert
  after insert on public.feed_comments
  for each row
  execute function public.activity_events_on_feed_comment_insert();
