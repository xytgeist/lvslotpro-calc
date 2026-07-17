-- Fix inbox "No messages yet" for R2 chat videos (video_url without stream_video_uid).
-- Preview helper previously only treated stream_video_uid as [video].

begin;

create or replace function public.chat_message_preview_text(
  p_deleted_at    timestamptz,
  p_body          text,
  p_image_urls    text[],
  p_video_uid     text,
  p_video_url     text default null
)
returns text
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  v_preview text;
  v_has_video boolean;
begin
  v_has_video :=
    nullif(trim(coalesce(p_video_uid, '')), '') is not null
    or nullif(trim(coalesce(p_video_url, '')), '') is not null;

  if p_deleted_at is not null then
    v_preview := 'This message was deleted';
  elsif char_length(trim(coalesce(p_body, ''))) > 0 then
    v_preview := left(trim(p_body), 60);
    if char_length(trim(p_body)) > 60 then
      v_preview := v_preview || '…';
    end if;
  elsif v_has_video then
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

-- Drop the old 4-arg overload so callers can't miss video_url.
drop function if exists public.chat_message_preview_text(timestamptz, text, text[], text);

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
                               NEW.deleted_at,
                               NEW.body,
                               NEW.image_urls,
                               NEW.stream_video_uid,
                               NEW.video_url
                             ),
    last_message_sender_id = NEW.sender_id
  where id = NEW.room_id;

  return NEW;
end;
$$;

create or replace function public.chat_rooms_on_message_image_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.image_urls is not distinct from OLD.image_urls then
    return NEW;
  end if;

  update public.chat_rooms
  set last_message_preview = public.chat_message_preview_text(
                               NEW.deleted_at,
                               NEW.body,
                               NEW.image_urls,
                               NEW.stream_video_uid,
                               NEW.video_url
                             )
  where id = NEW.room_id
    and last_message_at = NEW.created_at;

  return NEW;
end;
$$;

-- Refresh rooms whose latest message is an R2 video (or Stream video) with a blank preview.
update public.chat_rooms r
set last_message_preview = public.chat_message_preview_text(
  m.deleted_at,
  m.body,
  m.image_urls,
  m.stream_video_uid,
  m.video_url
)
from public.chat_messages m
where m.room_id = r.id
  and m.created_at = r.last_message_at
  and coalesce(nullif(trim(r.last_message_preview), ''), '') = ''
  and (
    nullif(trim(coalesce(m.video_url, '')), '') is not null
    or nullif(trim(coalesce(m.stream_video_uid, '')), '') is not null
  );

commit;
