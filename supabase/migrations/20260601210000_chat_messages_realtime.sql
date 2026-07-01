-- Enable Supabase Realtime for chat_messages so INSERT/UPDATE events are
-- broadcast to subscribers in open chat conversations.
--
-- Supabase publications are either FOR ALL TABLES (older projects) or
-- per-table (newer projects). This block handles both cases safely.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication
    WHERE  pubname = 'supabase_realtime'
      AND  puballtables = true
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
