-- Per-guide card accent (hex) derived from hero image. Nullable — legacy slug map remains fallback.
ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS card_accent_color text;

COMMENT ON COLUMN guides.card_accent_color IS
  'Optional #RRGGBB accent for expanded card border, manufacturer tint, +EV panel. Set from hero sampling; never required.';
