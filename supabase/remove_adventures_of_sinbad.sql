-- One-time cleanup: remove Adventures of Sinbad from Supabase.
-- Safe order: delete guide row first, then machine row.

DELETE FROM guides
WHERE slug = 'adventures-of-sinbad';

DELETE FROM machines
WHERE slug = 'adventures-of-sinbad';
