-- Repair: group member + star RPCs missing from API schema cache.
-- Run on test if you see: "Could not find the function public.chat_group_members_list"
-- or starred/settings fail while messages work. Safe to re-run.
BEGIN;

CREATE TABLE IF NOT EXISTS public.chat_message_stars (
  message_id uuid NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.chat_message_stars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_message_stars_select ON public.chat_message_stars;
CREATE POLICY chat_message_stars_select ON public.chat_message_stars
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.chat_messages msg
      JOIN public.chat_room_members mem ON mem.room_id = msg.room_id
      WHERE msg.id = chat_message_stars.message_id
        AND mem.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS chat_message_stars_mutate ON public.chat_message_stars;
CREATE POLICY chat_message_stars_mutate ON public.chat_message_stars
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.chat_room_members
  ADD COLUMN IF NOT EXISTS moderation_muted_until timestamptz;

CREATE OR REPLACE FUNCTION public.chat_group_header_members(p_room_id uuid)
RETURNS TABLE (
  user_id       uuid,
  display_name  text,
  handle        text,
  avatar_url    text,
  joined_at     timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.user_id, p.display_name, p.handle, p.avatar_url, m.joined_at
  FROM public.chat_room_members m
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.room_id = p_room_id
    AND EXISTS (
      SELECT 1 FROM public.chat_room_members v
      WHERE v.room_id = p_room_id AND v.user_id = auth.uid()
    )
  ORDER BY m.joined_at ASC NULLS LAST
  LIMIT 3;
$$;

CREATE OR REPLACE FUNCTION public.chat_group_members_list(p_room_id uuid)
RETURNS TABLE (
  user_id                  uuid,
  display_name             text,
  handle                   text,
  avatar_url               text,
  role                     text,
  joined_at                timestamptz,
  moderation_muted_until   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.user_id,
    p.display_name,
    p.handle,
    p.avatar_url,
    m.role,
    m.joined_at,
    m.moderation_muted_until
  FROM public.chat_room_members m
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.room_id = p_room_id
    AND EXISTS (
      SELECT 1 FROM public.chat_room_members v
      WHERE v.room_id = p_room_id AND v.user_id = auth.uid()
    )
  ORDER BY m.joined_at ASC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.chat_starred_messages_page(
  p_room_id uuid,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  message_id   uuid,
  body         text,
  created_at   timestamptz,
  sender_id    uuid,
  starred_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT msg.id, msg.body, msg.created_at, msg.sender_id, s.created_at
  FROM public.chat_message_stars s
  JOIN public.chat_messages msg ON msg.id = s.message_id
  WHERE s.user_id = auth.uid()
    AND msg.room_id = p_room_id
    AND msg.deleted_at IS NULL
  ORDER BY s.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
$$;

CREATE OR REPLACE FUNCTION public.chat_starred_message_ids(p_room_id uuid)
RETURNS TABLE (message_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.message_id
  FROM public.chat_message_stars s
  JOIN public.chat_messages msg ON msg.id = s.message_id
  WHERE s.user_id = auth.uid()
    AND msg.room_id = p_room_id;
$$;

REVOKE ALL ON FUNCTION public.chat_group_header_members(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_group_members_list(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_starred_messages_page(uuid, int) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_starred_message_ids(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_group_header_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_members_list(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_starred_messages_page(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_starred_message_ids(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
