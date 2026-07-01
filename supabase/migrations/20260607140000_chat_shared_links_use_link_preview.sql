-- Fix chat_room_shared_links to use link_preview->>'url' as the primary
-- source of URLs rather than only scanning msg.body with a regex.
--
-- Root cause: the body regex only matches https?:// prefixed URLs, but the
-- Edge unfurl also resolves bare domains (sportportactive.com → https://…).
-- Those messages have link_preview set but the regex skips them entirely.
--
-- Strategy:
--   1. Pull URL from link_preview JSONB (reliable, already-resolved).
--   2. UNION body-regex fallback for older messages that predate unfurl.
--      Only applied when link_preview IS NULL to avoid duplicates.

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
    sub.message_id, sub.url, sub.created_at, sub.sender_id, sub.body_preview
  FROM (
    -- Primary: URL from link_preview JSONB (catches bare domains + all unfurled links)
    SELECT msg.id                                          AS message_id,
           lower(msg.link_preview->>'url')                AS url,
           msg.created_at,
           msg.sender_id,
           left(coalesce(msg.body, ''), 120)              AS body_preview
    FROM public.chat_messages msg
    WHERE msg.room_id    = p_room_id
      AND msg.deleted_at IS NULL
      AND msg.link_preview IS NOT NULL
      AND (msg.link_preview->>'url') IS NOT NULL
      AND (msg.link_preview->>'url') <> ''

    UNION ALL

    -- Fallback: regex on body for pre-unfurl messages (no link_preview yet)
    SELECT msg.id                    AS message_id,
           lower((m)[1])             AS url,
           msg.created_at,
           msg.sender_id,
           left(msg.body, 120)       AS body_preview
    FROM public.chat_messages msg
    CROSS JOIN LATERAL regexp_matches(
      coalesce(msg.body, ''), '(https?://[^\s<>"]+)', 'gi'
    ) AS m
    WHERE msg.room_id    = p_room_id
      AND msg.deleted_at IS NULL
      AND coalesce(msg.body, '') <> ''
      AND msg.link_preview IS NULL
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
