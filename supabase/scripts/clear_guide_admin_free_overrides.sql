-- One-off prod repair (2026-07): remove admin guide overrides that unlocked paid guides.
-- Deletes rows only; code defaults in guideAccess.js apply again (FREE_GUIDE_SLUGS stay free).
-- Run on production (jtjgtucumuoswnbauxry) via SQL editor or:
--   supabase link --project-ref jtjgtucumuoswnbauxry --yes
--   supabase db query --linked -f supabase/scripts/clear_guide_admin_free_overrides.sql

begin;

select count(*) as guide_free_overrides_before
from public.content_access_gates
where content_kind = 'guide'
  and requires_slots_edge = false;

delete from public.content_access_gates
where content_kind = 'guide'
  and requires_slots_edge = false;

select count(*) as guide_free_overrides_after
from public.content_access_gates
where content_kind = 'guide'
  and requires_slots_edge = false;

commit;
