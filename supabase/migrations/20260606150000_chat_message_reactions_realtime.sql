-- Realtime for chat_message_reactions (live pill counts + attribution sheet).
-- Apply on test before client deploy. Requires chat_phase2 + unique index.

BEGIN;

-- DELETE events need message_id in payload.old — use the unique (message, user, emoji) index.
ALTER TABLE public.chat_message_reactions
  REPLICA IDENTITY USING INDEX chat_message_reactions_unique_idx;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication
    WHERE  pubname = 'supabase_realtime'
      AND  puballtables = true
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM   pg_publication_tables
      WHERE  pubname = 'supabase_realtime'
        AND  schemaname = 'public'
        AND  tablename = 'chat_message_reactions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
    END IF;
  END IF;
END $$;

COMMIT;
