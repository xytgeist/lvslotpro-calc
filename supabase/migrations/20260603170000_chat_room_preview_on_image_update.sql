-- Migration: fix chat inbox "No messages yet" for image/video messages
--
-- Two issues addressed:
--
-- 1. INSERT trigger had no branch for stream_video_uid (video messages fell
--    through to preview=''), and no branch for messages sent with image_urls=[]
--    while images are still uploading (has_pending_images flow).
--
-- 2. No UPDATE trigger existed, so when image_urls gets patched after background
--    uploads complete the room's last_message_preview was never refreshed.
--    Result: any image-only message showed "No messages yet" in the inbox.

begin;

-- ── Helper: compute preview text for a chat_messages row ──────────────────────

create or replace function public.chat_message_preview_text(
  p_deleted_at    timestamptz,
  p_body          text,
  p_image_urls    text[],
  p_video_uid     text
)
returns text
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  v_preview text;
begin
  if p_deleted_at is not null then
    v_preview := 'This message was deleted';
  elsif char_length(trim(coalesce(p_body, ''))) > 0 then
    v_preview := left(trim(p_body), 60);
    if char_length(trim(p_body)) > 60 then
      v_preview := v_preview || '…';
    end if;
  elsif p_video_uid is not null then
    v_preview := '[video]';
  elsif coalesce(cardinality(p_image_urls), 0) > 0 then
    v_preview := '[image]';
  else
    -- body empty, no images yet, no video — could be an in-flight image upload
    v_preview := '';
  end if;
  return v_preview;
end;
$$;

-- ── 1. Rewrite INSERT trigger to use helper + add video branch ─────────────────

create or replace function public.chat_rooms_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_rooms
  set
    last_message_at        = NEW.created_at,
    last_message_preview   = public.chat_message_preview_text(
                               NEW.deleted_at, NEW.body, NEW.image_urls,
                               NEW.stream_video_uid
                             ),
    last_message_sender_id = NEW.sender_id
  where id = NEW.room_id;

  return NEW;
end;
$$;

drop trigger if exists chat_messages_after_insert_update_room
  on public.chat_messages;

create trigger chat_messages_after_insert_update_room
  after insert on public.chat_messages
  for each row execute function public.chat_rooms_on_message_insert();

-- ── 2. New UPDATE trigger: refresh preview when image_urls is patched ──────────
--
-- Fires only when image_urls changes (avoids unnecessary work for reaction /
-- link-preview / read-receipt updates).  Only updates the room row when this
-- message is still the latest one (same created_at as last_message_at).

create or replace function public.chat_rooms_on_message_image_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip if image_urls didn't change
  if NEW.image_urls is not distinct from OLD.image_urls then
    return NEW;
  end if;

  -- Only update room preview if this is still the most recent message
  update public.chat_rooms
  set last_message_preview = public.chat_message_preview_text(
                               NEW.deleted_at, NEW.body, NEW.image_urls,
                               NEW.stream_video_uid
                             )
  where id      = NEW.room_id
    and last_message_at = NEW.created_at;

  return NEW;
end;
$$;

drop trigger if exists chat_messages_after_update_image_urls
  on public.chat_messages;

create trigger chat_messages_after_update_image_urls
  after update of image_urls on public.chat_messages
  for each row execute function public.chat_rooms_on_message_image_update();

commit;
