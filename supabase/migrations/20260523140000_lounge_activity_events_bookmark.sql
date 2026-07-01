-- Phase H1 extension — bookmark activity notifications.
-- Apply on test after 20260522120000_lounge_activity_events_phase_h1.sql
-- (and 20260523120000_lounge_activity_events_repost.sql if already applied).

alter table public.activity_events
  drop constraint if exists activity_events_event_type_check;

alter table public.activity_events
  add constraint activity_events_event_type_check
  check (
    event_type in (
      'comment_on_post',
      'reply_to_comment',
      'mention_in_post',
      'mention_in_comment',
      'follow',
      'repost',
      'quote_repost',
      'bookmark'
    )
  );

create or replace function public.activity_events_on_post_bookmark_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select cfp.user_id
    into v_owner
  from public.community_feed_posts cfp
  where cfp.id = new.post_id
    and cfp.hidden_at is null;

  if v_owner is not null then
    perform public.activity_events_insert_safe(
      v_owner,
      new.user_id,
      'bookmark',
      new.post_id,
      null
    );
  end if;

  return new;
exception
  when others then
    raise warning 'activity_events_on_post_bookmark_insert: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_activity_events_post_bookmark_insert on public.post_bookmarks;
create trigger trg_activity_events_post_bookmark_insert
  after insert on public.post_bookmarks
  for each row
  execute function public.activity_events_on_post_bookmark_insert();

create or replace function public.activity_events_on_feed_comment_bookmark_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_post_id uuid;
begin
  select fc.user_id, fc.post_id
    into v_owner, v_post_id
  from public.feed_comments fc
  where fc.id = new.comment_id
    and fc.hidden_at is null;

  if v_owner is not null and v_post_id is not null then
    perform public.activity_events_insert_safe(
      v_owner,
      new.user_id,
      'bookmark',
      v_post_id,
      new.comment_id
    );
  end if;

  return new;
exception
  when others then
    raise warning 'activity_events_on_feed_comment_bookmark_insert: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_activity_events_feed_comment_bookmark_insert on public.feed_comment_bookmarks;
create trigger trg_activity_events_feed_comment_bookmark_insert
  after insert on public.feed_comment_bookmarks
  for each row
  execute function public.activity_events_on_feed_comment_bookmark_insert();

comment on function public.activity_events_on_post_bookmark_insert() is
  'Notify post owner when someone bookmarks their post (insert only; unbookmark is silent).';

comment on function public.activity_events_on_feed_comment_bookmark_insert() is
  'Notify comment author when someone bookmarks their comment (insert only).';
