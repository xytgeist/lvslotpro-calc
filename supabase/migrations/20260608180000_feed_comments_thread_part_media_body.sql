-- Allow media-only thread parts (and replies) under the 320-char cap.

alter table public.feed_comments
  drop constraint if exists feed_comments_body_len;

alter table public.feed_comments
  add constraint feed_comments_body_len check (
    char_length(body) <= 320
    and (
      char_length(trim(body)) >= 1
      or (
        image_urls is not null
        and jsonb_typeof(image_urls) = 'array'
        and jsonb_array_length(image_urls) > 0
      )
      or length(trim(coalesce(media_url, ''))) > 0
      or length(trim(coalesce(gif_url, ''))) > 0
      or length(trim(coalesce(stream_video_uid, ''))) > 0
    )
  );
