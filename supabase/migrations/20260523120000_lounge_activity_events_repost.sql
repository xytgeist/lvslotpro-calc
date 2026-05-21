-- Phase H1 extension — repost + quote repost activity notifications.
-- Apply on test after 20260522120000_lounge_activity_events_phase_h1.sql.

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
      'quote_repost'
    )
  );

create or replace function public.activity_events_on_feed_post_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if new.hidden_at is not null then
    return new;
  end if;

  if new.repost_of_post_id is not null then
    select cfp.user_id
      into v_owner
    from public.community_feed_posts cfp
    where cfp.id = new.repost_of_post_id;

    if v_owner is not null then
      if coalesce(new.is_plain_repost, false) then
        perform public.activity_events_insert_safe(
          v_owner,
          new.user_id,
          'repost',
          new.id,
          null
        );
      else
        perform public.activity_events_insert_safe(
          v_owner,
          new.user_id,
          'quote_repost',
          new.id,
          null
        );
      end if;
    end if;
  elsif new.repost_of_comment_id is not null then
    select fc.user_id
      into v_owner
    from public.feed_comments fc
    where fc.id = new.repost_of_comment_id;

    if v_owner is not null then
      perform public.activity_events_insert_safe(
        v_owner,
        new.user_id,
        'repost',
        new.id,
        new.repost_of_comment_id
      );
    end if;
  end if;

  perform public.activity_events_emit_mentions(
    new.user_id,
    new.caption,
    'mention_in_post',
    new.id,
    null,
    null
  );

  return new;
exception
  when others then
    raise warning 'activity_events_on_feed_post_insert: %', sqlerrm;
    return new;
end;
$$;

comment on function public.activity_events_on_feed_post_insert() is
  'Activity emit on new feed posts: repost/quote-repost notify owner; @mentions in quote captions.';
