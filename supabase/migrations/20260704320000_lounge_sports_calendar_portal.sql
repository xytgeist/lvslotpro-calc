-- Sports betting calendar — admin list + save for bot portal editor.
-- Apply after 20260704310000.

create or replace function public.admin_lounge_sports_betting_calendar_list()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Los_Angeles', now()))::date;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;

  return coalesce((
    select jsonb_agg(row_obj order by (row_obj->>'start_date'), (row_obj->>'priority')::int desc, row_obj->>'label_short')
    from (
      select jsonb_build_object(
        'id', c.id,
        'slug', c.slug,
        'label_short', c.label_short,
        'title', c.title,
        'odds_sport_keys', c.odds_sport_keys,
        'kind', c.kind,
        'start_date', c.start_date,
        'end_date', c.end_date,
        'priority', c.priority,
        'caption_prefix', coalesce(c.caption_prefix, c.label_short),
        'enabled', c.enabled,
        'active_today', c.enabled and v_today between c.start_date and c.end_date,
        'status', case
          when not c.enabled then 'disabled'
          when v_today < c.start_date then 'upcoming'
          when v_today > c.end_date then 'past'
          else 'active'
        end,
        'created_at', c.created_at
      ) as row_obj
      from public.lounge_sports_betting_calendar c
    ) sub
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_lounge_sports_betting_calendar_list() from public;
grant execute on function public.admin_lounge_sports_betting_calendar_list() to authenticated;

comment on function public.admin_lounge_sports_betting_calendar_list() is
  'Admin portal: full sports betting calendar with PT-day active_today + status.';

create or replace function public.admin_lounge_sports_betting_calendar_save(p_row jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_slug text;
  v_label text;
  v_title text;
  v_keys text[];
  v_kind text;
  v_start date;
  v_end date;
  v_priority int;
  v_prefix text;
  v_enabled boolean;
  v_row public.lounge_sports_betting_calendar%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;
  if p_row is null or jsonb_typeof(p_row) <> 'object' then raise exception 'p_row must be a JSON object'; end if;

  v_id := nullif(p_row->>'id', '')::uuid;
  v_slug := lower(trim(p_row->>'slug'));
  v_label := trim(p_row->>'label_short');
  v_title := trim(p_row->>'title');
  v_kind := lower(trim(coalesce(p_row->>'kind', 'season')));
  v_start := nullif(p_row->>'start_date', '')::date;
  v_end := nullif(p_row->>'end_date', '')::date;
  v_priority := coalesce(nullif(p_row->>'priority', '')::int, 50);
  v_prefix := nullif(trim(p_row->>'caption_prefix'), '');
  v_enabled := coalesce((p_row->>'enabled')::boolean, true);

  if v_slug is null or v_slug = '' or v_slug !~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$' then
    raise exception 'slug must be 3-60 chars, lowercase letters, numbers, hyphens';
  end if;
  if v_label is null or v_label = '' then raise exception 'label_short required'; end if;
  if v_title is null or v_title = '' then raise exception 'title required'; end if;
  if v_kind not in ('tournament', 'season', 'marquee') then raise exception 'kind must be tournament, season, or marquee'; end if;
  if v_start is null or v_end is null then raise exception 'start_date and end_date required'; end if;
  if v_end < v_start then raise exception 'end_date must be on or after start_date'; end if;
  if v_priority < 0 or v_priority > 100 then raise exception 'priority must be between 0 and 100'; end if;

  if jsonb_typeof(p_row->'odds_sport_keys') = 'array' then
    select coalesce(array_agg(distinct lower(trim(value)) order by lower(trim(value))), '{}'::text[])
    into v_keys
    from jsonb_array_elements_text(p_row->'odds_sport_keys') as t(value)
    where trim(value) <> '';
  else
    v_keys := '{}'::text[];
  end if;

  if coalesce(array_length(v_keys, 1), 0) < 1 then
    raise exception 'odds_sport_keys must include at least one sport key';
  end if;

  if v_id is not null then
    update public.lounge_sports_betting_calendar
    set
      slug = v_slug,
      label_short = v_label,
      title = v_title,
      odds_sport_keys = v_keys,
      kind = v_kind,
      start_date = v_start,
      end_date = v_end,
      priority = v_priority,
      caption_prefix = coalesce(v_prefix, v_label),
      enabled = v_enabled
    where id = v_id
    returning * into v_row;

    if not found then raise exception 'calendar row not found'; end if;
  else
    insert into public.lounge_sports_betting_calendar (
      slug, label_short, title, odds_sport_keys, kind, start_date, end_date, priority, caption_prefix, enabled
    )
    values (
      v_slug, v_label, v_title, v_keys, v_kind, v_start, v_end, v_priority, coalesce(v_prefix, v_label), v_enabled
    )
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'ok', true,
    'row', jsonb_build_object(
      'id', v_row.id,
      'slug', v_row.slug,
      'label_short', v_row.label_short,
      'title', v_row.title,
      'odds_sport_keys', v_row.odds_sport_keys,
      'kind', v_row.kind,
      'start_date', v_row.start_date,
      'end_date', v_row.end_date,
      'priority', v_row.priority,
      'caption_prefix', v_row.caption_prefix,
      'enabled', v_row.enabled
    )
  );
exception
  when unique_violation then
    raise exception 'slug already exists: %', v_slug;
end;
$$;

revoke all on function public.admin_lounge_sports_betting_calendar_save(jsonb) from public;
grant execute on function public.admin_lounge_sports_betting_calendar_save(jsonb) to authenticated;

comment on function public.admin_lounge_sports_betting_calendar_save(jsonb) is
  'Admin portal: insert or update lounge_sports_betting_calendar row (id present = update).';
