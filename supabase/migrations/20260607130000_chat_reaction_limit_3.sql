-- Limit each user to 3 distinct emoji reactions on a single message.
-- The trigger fires BEFORE INSERT so it catches any path that writes to the table.

CREATE OR REPLACE FUNCTION chat_reaction_limit_check()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM chat_message_reactions
    WHERE message_id = NEW.message_id
      AND user_id    = NEW.user_id
  ) >= 3 THEN
    RAISE EXCEPTION 'reaction_limit_exceeded'
      USING ERRCODE = 'P0001',
            DETAIL  = 'A user may add at most 3 reactions to a single message.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_reaction_limit ON chat_message_reactions;
CREATE TRIGGER trg_chat_reaction_limit
  BEFORE INSERT ON chat_message_reactions
  FOR EACH ROW EXECUTE FUNCTION chat_reaction_limit_check();
