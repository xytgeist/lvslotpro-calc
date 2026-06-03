-- Chat read receipts — profile opt-out + room-scoped peer read positions for UI.
-- Apply on test before client deploy. Run AFTER chat_phase2 (last_read_* columns exist).

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_read_receipts_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.chat_read_receipts_enabled IS
  'When false, others cannot see this user''s chat read receipts and this user cannot see others'' read receipts (WhatsApp-style mutual privacy). Unread tracking still uses chat_room_members.last_read_* locally.';

-- Exposes other members'' read positions only when BOTH viewer and peer have receipts enabled.
CREATE OR REPLACE FUNCTION public.chat_room_read_receipts(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_viewer_enabled boolean := true;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_members m
    WHERE m.room_id = p_room_id AND m.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Not a member of this room' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(p.chat_read_receipts_enabled, true)
  INTO v_viewer_enabled
  FROM public.profiles p
  WHERE p.user_id = v_uid;

  RETURN jsonb_build_object(
    'viewer_receipts_enabled', v_viewer_enabled,
    'members', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', m.user_id,
          'receipts_enabled', COALESCE(p.chat_read_receipts_enabled, true),
          'last_read_at', CASE
            WHEN v_viewer_enabled AND COALESCE(p.chat_read_receipts_enabled, true)
              THEN m.last_read_at
            ELSE NULL
          END,
          'last_read_message_id', CASE
            WHEN v_viewer_enabled AND COALESCE(p.chat_read_receipts_enabled, true)
              THEN m.last_read_message_id
            ELSE NULL
          END
        )
        ORDER BY m.user_id
      )
      FROM public.chat_room_members m
      LEFT JOIN public.profiles p ON p.user_id = m.user_id
      WHERE m.room_id = p_room_id
        AND m.user_id <> v_uid
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.chat_room_read_receipts(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_room_read_receipts(uuid) TO authenticated;

COMMIT;
