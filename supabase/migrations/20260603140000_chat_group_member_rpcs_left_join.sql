-- Group member RPCs: include members even when profiles row is missing (LEFT JOIN).
-- Requires moderation_muted_until (from 20260603100000); adds column if that migration was skipped.
BEGIN;

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

REVOKE ALL ON FUNCTION public.chat_group_header_members(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.chat_group_members_list(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_group_header_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_members_list(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
