-- Align feed_comments.body with lounge post captions (280 chars).
-- Existing rows longer than 280 are truncated via left() (same rule as client).

alter table public.feed_comments drop constraint if exists feed_comments_body_len;

update public.feed_comments
set body = left(body, 280)
where char_length(body) > 280;

alter table public.feed_comments add constraint feed_comments_body_len
  check (char_length(body) >= 1 and char_length(body) <= 280);
