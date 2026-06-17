-- Drop legacy IGT Must Hit By duplicate. Canonical guide + machine slug: igt-must-hit-by.

delete from public.content_access_gates
where content_kind = 'guide'
  and content_key = 'must-hit-by-igt';

delete from public.guides
where slug = 'must-hit-by-igt';

delete from public.machines m
where m.slug = 'must-hit-by-igt'
  and not exists (
    select 1
    from public.guides g
    where g.machine_id = m.id
  );
