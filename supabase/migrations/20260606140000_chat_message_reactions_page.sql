-- Per-user reaction rows for a message (attribution sheet).
-- Apply on test before client deploy. Requires chat_phase2 + chat_message_reactions_agg.

BEGIN;

CREATE OR REPLACE FUNCTION public.chat_message_reactions_page(p_message_id uuid)
RETURNS TABLE (
  user_id       uuid,
  emoji         text,
  created_at    timestamptz,
  display_name  text,
  handle        text,
  avatar_url    text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.user_id,
    r.emoji,
    r.created_at,
    p.display_name,
    p.handle,
    p.avatar_url
  FROM public.chat_message_reactions r
  JOIN public.chat_messages msg ON msg.id = r.message_id
  JOIN public.chat_room_members mem
    ON mem.room_id = msg.room_id
   AND mem.user_id = (SELECT auth.uid())
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.message_id = p_message_id
  ORDER BY r.created_at ASC, r.user_id;
$$;

REVOKE ALL ON FUNCTION public.chat_message_reactions_page(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_message_reactions_page(uuid) TO authenticated;

COMMIT;
