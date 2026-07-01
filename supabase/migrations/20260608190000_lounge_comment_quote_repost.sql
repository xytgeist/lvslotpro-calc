-- Allow quote reposts of feed comments (thread parts and replies), not just plain comment reposts.

create or replace function public.community_feed_posts_validate_quote_repost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_images boolean;
begin
  -- ── Comment repost ────────────────────────────────────────────────────────
  if new.repost_of_comment_id is not null then
    if new.repost_of_post_id is not null then
      raise exception 'Cannot set both repost_of_post_id and repost_of_comment_id';
    end if;
    if not exists (
      select 1 from public.feed_comments c
      where c.id = new.repost_of_comment_id and c.hidden_at is null
    ) then
      raise exception 'Comment not found or hidden';
    end if;
    if coalesce(new.is_plain_repost, false) = true then
      if length(trim(coalesce(new.caption, ''))) > 0 then
        raise exception 'Plain repost must have an empty caption';
      end if;
    else
      has_images :=
        new.image_urls is not null
        and jsonb_typeof(new.image_urls) = 'array'
        and jsonb_array_length(new.image_urls) > 0;
      if length(trim(coalesce(new.caption, ''))) < 1 then
        if not (
          has_images
          or length(trim(coalesce(new.media_url, ''))) > 0
          or length(trim(coalesce(new.gif_url, ''))) > 0
          or length(trim(coalesce(new.stream_video_uid, ''))) > 0
        ) then
          raise exception 'Quote repost requires a comment or media (image, GIF, or video)';
        end if;
      end if;
    end if;
    return new;
  end if;

  -- ── Post repost (original logic) ─────────────────────────────────────────
  if new.repost_of_post_id is null then
    return new;
  end if;

  if new.repost_of_post_id = new.id then
    raise exception 'Cannot quote-repost a post onto itself';
  end if;

  if not exists (
    select 1
    from public.community_feed_posts c
    where c.id = new.repost_of_post_id
      and c.hidden_at is null
  ) then
    if exists (select 1 from public.community_feed_posts c where c.id = new.repost_of_post_id) then
      raise exception 'Cannot quote a hidden post';
    else
      raise exception 'Original post not found';
    end if;
  end if;

  if coalesce(new.is_plain_repost, false) = true then
    if length(trim(coalesce(new.caption, ''))) > 0 then
      raise exception 'Plain repost must have an empty caption';
    end if;
  else
    has_images :=
      new.image_urls is not null
      and jsonb_typeof(new.image_urls) = 'array'
      and jsonb_array_length(new.image_urls) > 0;

    if length(trim(coalesce(new.caption, ''))) < 1 then
      if not (
        has_images
        or length(trim(coalesce(new.media_url, ''))) > 0
        or length(trim(coalesce(new.gif_url, ''))) > 0
      ) then
        raise exception 'Quote repost requires a comment or media (image or GIF)';
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Quote-repost of a comment should notify as quote_repost, not plain repost.
create or replace function public.activity_events_on_feed_post_insert()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_owner uuid;
begin
  if new.repost_of_post_id is not null then
    select p.user_id into v_owner from public.community_feed_posts p where p.id = new.repost_of_post_id;
    if v_owner is null then
      raise warning 'activity_events_on_feed_post_insert: repost source post % not found', new.repost_of_post_id;
    elsif v_owner is distinct from new.user_id then
      if coalesce(new.is_plain_repost, false) then
        perform public.activity_events_insert_safe(
          v_owner,
          new.user_id,
          'repost',
          new.id,
          new.repost_of_post_id,
          null
        );
      else
        perform public.activity_events_insert_safe(
          v_owner,
          new.user_id,
          'quote_repost',
          new.id,
          null,
          null
        );
      end if;
    end if;
  elsif new.repost_of_comment_id is not null then
    select fc.user_id into v_owner from public.feed_comments fc where fc.id = new.repost_of_comment_id;
    if v_owner is null then
      raise warning 'activity_events_on_feed_post_insert: repost source comment % not found', new.repost_of_comment_id;
    elsif v_owner is distinct from new.user_id then
      if coalesce(new.is_plain_repost, false) then
        perform public.activity_events_insert_safe(
          v_owner,
          new.user_id,
          'repost',
          new.id,
          new.repost_of_comment_id,
          null
        );
      else
        perform public.activity_events_insert_safe(
          v_owner,
          new.user_id,
          'quote_repost',
          new.id,
          new.repost_of_comment_id,
          null
        );
      end if;
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
