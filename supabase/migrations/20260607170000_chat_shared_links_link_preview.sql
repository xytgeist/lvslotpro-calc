-- Return link_preview jsonb with shared links for rich group-info link cards.

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
  body_preview text,
  link_preview jsonb
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
  SELECT DISTINCT ON (sub.url_norm)
    sub.message_id,
    sub.url,
    sub.created_at,
    sub.sender_id,
    sub.body_preview,
    sub.link_preview
  FROM (
    SELECT
      raw.message_id,
      raw.url,
      lower(regexp_replace(trim(raw.url), '/+$', '')) AS url_norm,
      raw.created_at,
      raw.sender_id,
      raw.body_preview,
      raw.link_preview
    FROM (
      SELECT
        msg.id                             AS message_id,
        lower(trim(msg.link_preview->>'url')) AS url,
        msg.created_at,
        msg.sender_id,
        left(coalesce(msg.body, ''), 120)  AS body_preview,
        msg.link_preview
      FROM public.chat_messages msg
      WHERE msg.room_id = p_room_id
        AND msg.deleted_at IS NULL
        AND coalesce(trim(msg.link_preview->>'url'), '') <> ''

      UNION ALL

      SELECT
        msg.id,
        lower((m)[1]),
        msg.created_at,
        msg.sender_id,
        left(coalesce(msg.body, ''), 120),
        msg.link_preview
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

      SELECT
        msg.id,
        lower('https://' || (m)[1]),
        msg.created_at,
        msg.sender_id,
        left(coalesce(msg.body, ''), 120),
        msg.link_preview
      FROM public.chat_messages msg
      CROSS JOIN LATERAL regexp_matches(
        coalesce(msg.body, ''),
        '(([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:/[^\s<>"]*)?)',
        'gi'
      ) AS m
      WHERE msg.room_id = p_room_id
        AND msg.deleted_at IS NULL
        AND coalesce(msg.body, '') <> ''
        AND coalesce(msg.body, '') !~* 'https?://'
        AND coalesce(trim(msg.link_preview->>'url'), '') = ''
    ) raw
    WHERE raw.url IS NOT NULL
      AND raw.url <> ''
      AND raw.url ~* '\.[a-z]{2,}'
  ) sub
  WHERE (
    NOT p_docs_only
    OR sub.url ~* '\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z)(\?|#|$)'
  )
  ORDER BY sub.url_norm, (sub.link_preview IS NOT NULL) DESC, sub.created_at DESC
  LIMIT lim;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_room_shared_links(uuid, int, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_room_shared_links(uuid, int, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
