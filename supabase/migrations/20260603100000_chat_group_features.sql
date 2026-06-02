-- Group chat: avatar/description, member moderation mute, stars, pins, header/member RPCs.
BEGIN;

ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.chat_room_members
  ADD COLUMN IF NOT EXISTS moderation_muted_until timestamptz;

COMMENT ON COLUMN public.chat_room_members.moderation_muted_until IS
  'Owner/admin: member cannot send until this time (null = not moderated).';

CREATE TABLE IF NOT EXISTS public.chat_message_stars (
  message_id uuid NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_message_stars_user_room_idx
  ON public.chat_message_stars (user_id, created_at DESC);

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

CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
  room_id     uuid NOT NULL REFERENCES public.chat_rooms (id) ON DELETE CASCADE,
  message_id  uuid NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
  pinned_by   uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pinned_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, message_id)
);

ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_pinned_messages_select ON public.chat_pinned_messages;
CREATE POLICY chat_pinned_messages_select ON public.chat_pinned_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members m
      WHERE m.room_id = chat_pinned_messages.room_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

-- Header stack: first 3 members (stable join order).
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
  SELECT p.user_id, p.display_name, p.handle, p.avatar_url, m.joined_at
  FROM public.chat_room_members m
  JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.room_id = p_room_id
    AND EXISTS (
      SELECT 1 FROM public.chat_room_members v
      WHERE v.room_id = p_room_id AND v.user_id = auth.uid()
    )
  ORDER BY m.joined_at ASC
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
    p.user_id,
    p.display_name,
    p.handle,
    p.avatar_url,
    m.role,
    m.joined_at,
    m.moderation_muted_until
  FROM public.chat_room_members m
  JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.room_id = p_room_id
    AND EXISTS (
      SELECT 1 FROM public.chat_room_members v
      WHERE v.room_id = p_room_id AND v.user_id = auth.uid()
    )
  ORDER BY m.joined_at ASC;
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

-- Extend inbox list with group metadata.
CREATE OR REPLACE FUNCTION public.chat_rooms_for_user(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id                     uuid,
  kind                   text,
  slug                   text,
  title                  text,
  dm_key                 text,
  subscriber_only        boolean,
  last_message_at        timestamptz,
  last_message_preview   text,
  last_message_sender_id uuid,
  last_read_at           timestamptz,
  muted_until            timestamptz,
  member_role            text,
  has_unread             boolean,
  pinned                 boolean,
  peer_user_id           uuid,
  peer_handle            text,
  peer_display_name      text,
  peer_avatar_url        text,
  sender_handle          text,
  sender_display_name    text,
  avatar_url             text,
  description            text,
  created_by             uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.kind,
    r.slug,
    r.title,
    r.dm_key,
    r.subscriber_only,
    r.last_message_at,
    r.last_message_preview,
    r.last_message_sender_id,
    m.last_read_at,
    m.muted_until,
    m.role,
    (
      r.last_message_at IS NOT NULL
      AND (m.last_read_at IS NULL OR r.last_message_at > m.last_read_at)
    ) AS has_unread,
    COALESCE(m.pinned, false) AS pinned,
    peer_prof.user_id,
    peer_prof.handle,
    peer_prof.display_name,
    peer_prof.avatar_url,
    sender_prof.handle,
    sender_prof.display_name,
    r.avatar_url,
    r.description,
    r.created_by
  FROM public.chat_room_members m
  JOIN public.chat_rooms r ON r.id = m.room_id
  LEFT JOIN public.profiles peer_prof
    ON r.kind = 'dm'
    AND peer_prof.user_id = CASE
      WHEN r.dm_key IS NULL THEN NULL::uuid
      WHEN split_part(r.dm_key, '::', 1)::text = p_user_id::text
      THEN split_part(r.dm_key, '::', 2)::uuid
      ELSE split_part(r.dm_key, '::', 1)::uuid
    END
  LEFT JOIN public.profiles sender_prof
    ON sender_prof.user_id = r.last_message_sender_id
  WHERE m.user_id = p_user_id
  ORDER BY COALESCE(m.pinned, false) DESC, r.last_message_at DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.chat_group_header_members(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_group_members_list(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_starred_messages_page(uuid, int) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_starred_message_ids(uuid) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.chat_group_header_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_members_list(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_starred_messages_page(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_starred_message_ids(uuid) TO authenticated;

COMMIT;
