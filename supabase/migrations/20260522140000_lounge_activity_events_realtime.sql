-- Realtime: live unread badge while Lounge is open (Phase H1 follow-up).
-- Safe to re-run: ignore error if table is already in supabase_realtime publication.

do $$
begin
  alter publication supabase_realtime add table public.activity_events;
exception
  when duplicate_object then
    null;
  when others then
    if sqlerrm not like '%already member of publication%' then
      raise;
    end if;
end;
$$;
