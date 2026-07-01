-- chat_room_shared_links v2 — reliable URL extraction for group info → Links tab.
--
-- Prior fixes still missed links when:
--   • body is a bare domain (sportportactive.com) with no https:// prefix
--   • link_preview row exists but url is empty (fallback was blocked by link_preview IS NULL)
--
-- Strategy (all branches, deduped by url):
--   1. link_preview->>'url' when present
--   2. every https?:// match in body (always — not gated on link_preview)
--   3. bare-domain matches in body when body has no explicit scheme

DROP FUNCTION IF EXISTS public.chat_room_shared_links(uuid, int, boolean);

CREATE OR REPLACE FUNCTION public.chat_room_shared_links(
  p_room_id   uuid,
  p_limit     int     DEFAULT 80,
  p_docs_only boolean DEFAULT false
)
RETURNS TABLE (
  message_id   uuid,
  url          text,
  created_at   timestamptz,
  sender_id    uuid,
  body_preview text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE lim int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_members m
    WHERE m.room_id = p_room_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'NOT_MEMBER' USING MESSAGE = 'You are not a member of this room.';
  END IF;

  lim := greatest(1, least(coalesce(p_limit, 80), 200));

  RETURN QUERY
  SELECT DISTINCT ON (sub.url)
    sub.message_id,
    sub.url,
    sub.created_at,
    sub.sender_id,
    sub.body_preview
  FROM (
    -- 1) Resolved preview URL (bare domains normalized at unfurl time)
    SELECT
      msg.id                             AS message_id,
      lower(trim(msg.link_preview->>'url')) AS url,
      msg.created_at,
      msg.sender_id,
      left(coalesce(msg.body, ''), 120)  AS body_preview
    FROM public.chat_messages msg
    WHERE msg.room_id = p_room_id
      AND msg.deleted_at IS NULL
      AND coalesce(trim(msg.link_preview->>'url'), '') <> ''

    UNION ALL

    -- 2) Explicit http(s) URLs in body
    SELECT
      msg.id,
      lower((m)[1]),
      msg.created_at,
      msg.sender_id,
      left(coalesce(msg.body, ''), 120)
    FROM public.chat_messages msg
    CROSS JOIN LATERAL regexp_matches(
      coalesce(msg.body, ''),
      '(https?://[^\s<>"]+)',
      'gi'
    ) AS m
    WHERE msg.room_id = p_room_id
      AND msg.deleted_at IS NULL
      AND coalesce(msg.body, '') <> ''

    UNION ALL

    -- 3) Bare domains in body (no scheme in message text)
    SELECT
      msg.id,
      lower('https://' || (m)[1]),
      msg.created_at,
      msg.sender_id,
      left(coalesce(msg.body, ''), 120)
    FROM public.chat_messages msg
    CROSS JOIN LATERAL regexp_matches(
      coalesce(msg.body, ''),
      '([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:/[^\s<>"]*)?',
      'gi'
    ) AS m
    WHERE msg.room_id = p_room_id
      AND msg.deleted_at IS NULL
      AND coalesce(msg.body, '') <> ''
      AND coalesce(msg.body, '') !~* 'https?://'
  ) sub
  WHERE sub.url IS NOT NULL
    AND sub.url <> ''
    AND (
      NOT p_docs_only
      OR sub.url ~* '\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z)(\?|#|$)'
    )
  ORDER BY sub.url, sub.created_at DESC
  LIMIT lim;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_room_shared_links(uuid, int, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_room_shared_links(uuid, int, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
