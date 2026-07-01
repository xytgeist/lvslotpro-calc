-- Play Logbook — play manager (one per session) + per-partner Paid flag.

alter table public.play_log_session_partners
  add column if not exists is_manager boolean not null default false,
  add column if not exists paid boolean not null default false;

create unique index if not exists play_log_session_partners_one_manager_idx
  on public.play_log_session_partners (session_id)
  where is_manager = true;

create or replace function public.play_log_partners_has_manager(p_partners jsonb)
returns boolean
language sql
immutable
as $$
  select count(*)::int = 1
  from jsonb_array_elements(p_partners) elem
  where coalesce((elem->>'is_manager')::boolean, false);
$$;

-- Session manager or creator may update paid flags only.
create or replace function public.play_log_update_session_partners_paid(
  p_session_id uuid,
  p_partners jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_partner jsonb;
  v_kind text;
  v_target uuid;
  v_guest text;
  v_paid boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_partners is null or jsonb_typeof(p_partners) <> 'array' then
    raise exception 'partners required';
  end if;

  if not exists (
    select 1
    from public.play_log_sessions s
    where s.id = p_session_id
      and s.created_by_user_id = v_uid
  )
  and not exists (
    select 1
    from public.play_log_session_partners sp
    where sp.session_id = p_session_id
      and sp.participant_kind = 'user'
      and sp.user_id = v_uid
      and sp.is_manager = true
  ) then
    raise exception 'Only the creator or play manager can update paid status';
  end if;

  for v_partner in select jsonb_array_elements(p_partners)
  loop
    v_kind := v_partner->>'kind';
    v_paid := coalesce((v_partner->>'paid')::boolean, false);

    if v_kind = 'user' then
      v_target := (v_partner->>'user_id')::uuid;
      update public.play_log_session_partners sp
      set paid = v_paid
      where sp.session_id = p_session_id
        and sp.participant_kind = 'user'
        and sp.user_id = v_target;
    elsif v_kind = 'guest' then
      v_guest := btrim(v_partner->>'guest_label');
      update public.play_log_session_partners sp
      set paid = v_paid
      where sp.session_id = p_session_id
        and sp.participant_kind = 'guest'
        and sp.guest_label = v_guest;
    end if;
  end loop;
end;
$$;

grant execute on function public.play_log_update_session_partners_paid(uuid, jsonb) to authenticated;

drop function if exists public.play_log_session_partners_list(uuid);

create or replace function public.play_log_session_partners_list(p_session_id uuid)
returns table (
  id uuid,
  participant_kind text,
  user_id uuid,
  guest_label text,
  share_percent numeric,
  sort_order int,
  is_manager boolean,
  paid boolean,
  handle text,
  display_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    sp.id,
    sp.participant_kind,
    sp.user_id,
    sp.guest_label,
    sp.share_percent,
    sp.sort_order,
    sp.is_manager,
    sp.paid,
    p.handle,
    p.display_name,
    p.avatar_url
  from public.play_log_session_partners sp
  join public.play_log_sessions s on s.id = sp.session_id
  left join public.profiles p on p.user_id = sp.user_id
  where sp.session_id = p_session_id
    and (
      s.created_by_user_id = auth.uid()
      or exists (
        select 1
        from public.play_log_entries e
        where e.session_id = s.id and e.user_id = auth.uid()
      )
    )
  order by sp.sort_order asc;
$$;

grant execute on function public.play_log_session_partners_list(uuid) to authenticated;

-- Extend save shared session (partner insert includes manager + paid).
create or replace function public.play_log_save_shared_session(
  p_template_id uuid,
  p_captured_at timestamptz,
  p_casino_name text,
  p_notes text,
  p_values jsonb,
  p_partners jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session_id uuid;
  v_partner jsonb;
  v_kind text;
  v_target uuid;
  v_guest text;
  v_pct numeric;
  v_sort int := 0;
  v_entry_id uuid;
  v_has_extra_partner boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_template_id is null then
    raise exception 'template_id required';
  end if;

  if not public.play_log_partners_sum_valid(p_partners) then
    raise exception 'Partner shares must total 100%%';
  end if;

  if not public.play_log_partners_has_manager(p_partners) then
    raise exception 'Select exactly one play manager';
  end if;

  if not exists (
    select 1 from public.play_log_game_templates t
    where t.id = p_template_id and (t.is_system = true or t.user_id = v_uid)
  ) then
    raise exception 'Invalid game template';
  end if;

  for v_partner in select jsonb_array_elements(p_partners)
  loop
    v_kind := v_partner->>'kind';
    v_pct := (v_partner->>'share_percent')::numeric;
    if v_kind = 'user' then
      v_target := (v_partner->>'user_id')::uuid;
      if v_target is null then
        raise exception 'Invalid partner user';
      end if;
      if v_target <> v_uid and not public.play_log_partner_in_graph(v_uid, v_target) then
        raise exception 'Partner must follow you or be someone you follow';
      end if;
      if v_target <> v_uid then
        v_has_extra_partner := true;
      end if;
    elsif v_kind = 'guest' then
      v_guest := btrim(v_partner->>'guest_label');
      if v_guest is null or v_guest = '' then
        raise exception 'Guest name required';
      end if;
      v_has_extra_partner := true;
    else
      raise exception 'Invalid partner kind';
    end if;
    if v_pct is null or v_pct <= 0 or v_pct > 100 then
      raise exception 'Invalid share percent';
    end if;
  end loop;

  if not v_has_extra_partner then
    raise exception 'Add at least one partner or save without shared session';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(p_partners) elem
    where elem->>'kind' = 'user' and (elem->>'user_id')::uuid = v_uid
  ) then
    raise exception 'Include yourself in partners';
  end if;

  insert into public.play_log_sessions (
    created_by_user_id,
    template_id,
    captured_at,
    casino_name,
    notes,
    values
  )
  values (
    v_uid,
    p_template_id,
    coalesce(p_captured_at, now()),
    nullif(btrim(p_casino_name), ''),
    nullif(btrim(p_notes), ''),
    coalesce(p_values, '{}'::jsonb)
  )
  returning id into v_session_id;

  for v_partner in select jsonb_array_elements(p_partners)
  loop
    v_kind := v_partner->>'kind';
    v_pct := (v_partner->>'share_percent')::numeric;
    v_sort := v_sort + 1;

    insert into public.play_log_session_partners (
      session_id,
      participant_kind,
      user_id,
      guest_label,
      share_percent,
      sort_order,
      is_manager,
      paid
    )
    values (
      v_session_id,
      v_kind,
      case when v_kind = 'user' then (v_partner->>'user_id')::uuid else null end,
      case when v_kind = 'guest' then btrim(v_partner->>'guest_label') else null end,
      v_pct,
      v_sort,
      coalesce((v_partner->>'is_manager')::boolean, false),
      coalesce((v_partner->>'paid')::boolean, false)
    );

    if v_kind = 'user' then
      v_target := (v_partner->>'user_id')::uuid;
      insert into public.play_log_entries (
        user_id,
        session_id,
        template_id,
        captured_at,
        casino_name,
        notes,
        values
      )
      values (
        v_target,
        v_session_id,
        p_template_id,
        coalesce(p_captured_at, now()),
        nullif(btrim(p_casino_name), ''),
        nullif(btrim(p_notes), ''),
        coalesce(p_values, '{}'::jsonb)
      )
      returning id into v_entry_id;

      if v_target <> v_uid then
        perform public.activity_events_insert_safe(
          v_target,
          v_uid,
          'play_log_shared',
          null,
          null,
          v_entry_id
        );
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'session_id', v_session_id,
    'creator_entry_id', (
      select e.id
      from public.play_log_entries e
      where e.session_id = v_session_id and e.user_id = v_uid
      limit 1
    )
  );
end;
$$;

grant execute on function public.play_log_save_shared_session(uuid, timestamptz, text, text, jsonb, jsonb) to authenticated;

-- Extend update shared session.
drop function if exists public.play_log_update_shared_session(uuid, timestamptz, text, text, jsonb, jsonb);

create or replace function public.play_log_update_shared_session(
  p_session_id uuid,
  p_captured_at timestamptz,
  p_casino_name text,
  p_notes text,
  p_values jsonb,
  p_partners jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_template_id uuid;
  v_existing_users uuid[];
  v_partner jsonb;
  v_kind text;
  v_target uuid;
  v_guest text;
  v_pct numeric;
  v_sort int := 0;
  v_entry_id uuid;
  v_is_new_user boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_partners is null or jsonb_typeof(p_partners) <> 'array' then
    raise exception 'partners required';
  end if;

  if not public.play_log_partners_sum_valid(p_partners) then
    raise exception 'Partner shares must total 100%%';
  end if;

  if not public.play_log_partners_has_manager(p_partners) then
    raise exception 'Select exactly one play manager';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(p_partners) elem
    where elem->>'kind' = 'user' and (elem->>'user_id')::uuid = v_uid
  ) then
    raise exception 'Include yourself in partners';
  end if;

  select s.template_id
  into v_template_id
  from public.play_log_sessions s
  where s.id = p_session_id
    and s.created_by_user_id = v_uid;

  if v_template_id is null then
    raise exception 'Only the creator can edit this shared play';
  end if;

  select coalesce(array_agg(sp.user_id), '{}'::uuid[])
  into v_existing_users
  from public.play_log_session_partners sp
  where sp.session_id = p_session_id
    and sp.participant_kind = 'user'
    and sp.user_id is not null;

  for v_partner in select jsonb_array_elements(p_partners)
  loop
    v_kind := v_partner->>'kind';
    v_pct := (v_partner->>'share_percent')::numeric;

    if v_kind = 'user' then
      v_target := (v_partner->>'user_id')::uuid;
      if v_target is null then
        raise exception 'Invalid partner user';
      end if;
      v_is_new_user := not (v_target = any (v_existing_users));
      if v_target <> v_uid
         and v_is_new_user
         and not public.play_log_partner_in_graph(v_uid, v_target) then
        raise exception 'Partner must follow you or be someone you follow';
      end if;
    elsif v_kind = 'guest' then
      v_guest := btrim(v_partner->>'guest_label');
      if v_guest is null or v_guest = '' then
        raise exception 'Guest name required';
      end if;
    else
      raise exception 'Invalid partner kind';
    end if;

    if v_pct is null or v_pct <= 0 or v_pct > 100 then
      raise exception 'Invalid share percent';
    end if;
  end loop;

  update public.play_log_sessions s
  set
    captured_at = coalesce(p_captured_at, s.captured_at),
    casino_name = nullif(btrim(p_casino_name), ''),
    notes = nullif(btrim(p_notes), ''),
    values = coalesce(p_values, s.values),
    updated_at = now()
  where s.id = p_session_id
    and s.created_by_user_id = v_uid;

  update public.play_log_entries e
  set
    captured_at = coalesce(p_captured_at, e.captured_at),
    casino_name = nullif(btrim(p_casino_name), ''),
    notes = nullif(btrim(p_notes), ''),
    values = coalesce(p_values, e.values),
    updated_at = now()
  where e.session_id = p_session_id;

  delete from public.play_log_entries e
  where e.session_id = p_session_id
    and not exists (
      select 1
      from jsonb_array_elements(p_partners) elem
      where elem->>'kind' = 'user'
        and (elem->>'user_id')::uuid = e.user_id
    );

  delete from public.play_log_session_partners sp
  where sp.session_id = p_session_id;

  for v_partner in select jsonb_array_elements(p_partners)
  loop
    v_kind := v_partner->>'kind';
    v_pct := (v_partner->>'share_percent')::numeric;
    v_sort := v_sort + 1;

    insert into public.play_log_session_partners (
      session_id,
      participant_kind,
      user_id,
      guest_label,
      share_percent,
      sort_order,
      is_manager,
      paid
    )
    values (
      p_session_id,
      v_kind,
      case when v_kind = 'user' then (v_partner->>'user_id')::uuid else null end,
      case when v_kind = 'guest' then btrim(v_partner->>'guest_label') else null end,
      v_pct,
      v_sort,
      coalesce((v_partner->>'is_manager')::boolean, false),
      coalesce((v_partner->>'paid')::boolean, false)
    );

    if v_kind = 'user' then
      v_target := (v_partner->>'user_id')::uuid;

      select e.id
      into v_entry_id
      from public.play_log_entries e
      where e.session_id = p_session_id
        and e.user_id = v_target
      limit 1;

      if v_entry_id is null then
        insert into public.play_log_entries (
          user_id,
          session_id,
          template_id,
          captured_at,
          casino_name,
          notes,
          values
        )
        values (
          v_target,
          p_session_id,
          v_template_id,
          coalesce(p_captured_at, now()),
          nullif(btrim(p_casino_name), ''),
          nullif(btrim(p_notes), ''),
          coalesce(p_values, '{}'::jsonb)
        )
        returning id into v_entry_id;

        if v_target <> v_uid then
          perform public.activity_events_insert_safe(
            v_target,
            v_uid,
            'play_log_shared',
            null,
            null,
            v_entry_id
          );
        end if;
      end if;
    end if;
  end loop;
end;
$$;

grant execute on function public.play_log_update_shared_session(uuid, timestamptz, text, text, jsonb, jsonb) to authenticated;
