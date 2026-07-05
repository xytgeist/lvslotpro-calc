-- Scott Sharpe coverage tiers on sports calendar + expanded 2026 event seed.
-- Apply after 20260704320000. Redeploy lounge-odds-poll after apply.

alter table public.lounge_sports_betting_calendar
  add column if not exists coverage_tier smallint check (coverage_tier is null or coverage_tier between 1 and 3);

comment on column public.lounge_sports_betting_calendar.coverage_tier is
  'Scott coverage tier: 1=heavy, 2=medium, 3=opportunistic. Null = infer from odds_sport_keys.';

-- Tier assignments for existing seed rows
update public.lounge_sports_betting_calendar set coverage_tier = 1, priority = 100
  where slug = 'fifa-world-cup-2026';
update public.lounge_sports_betting_calendar set coverage_tier = 1 where slug in (
  'mlb-2026', 'nba-2026', 'nfl-2026', 'ncaaf-2026', 'nhl-2026'
);
update public.lounge_sports_betting_calendar set coverage_tier = 2, priority = 55
  where slug = 'wnba-2026';
update public.lounge_sports_betting_calendar set coverage_tier = 2, priority = 92
  where slug = 'march-madness-2026';
update public.lounge_sports_betting_calendar set coverage_tier = 2 where slug in (
  'wimbledon-2026', 'us-open-tennis-2026'
);
update public.lounge_sports_betting_calendar set coverage_tier = 1, priority = 45
  where slug = 'nfl-preseason-2026';

insert into public.lounge_sports_betting_calendar
  (slug, label_short, title, odds_sport_keys, kind, start_date, end_date, priority, caption_prefix, coverage_tier)
values
  (
    'premier-league-2025-26',
    'Premier League',
    'Premier League 2025-26',
    array['soccer_epl']::text[],
    'season',
    '2025-08-15',
    '2026-05-24',
    78,
    'Premier League',
    1
  ),
  (
    'top-euro-soccer-2025-26',
    'Top Euro Soccer',
    'La Liga, Bundesliga, Serie A, Ligue 1, UEFA',
    array[
      'soccer_spain_la_liga',
      'soccer_germany_bundesliga',
      'soccer_italy_serie_a',
      'soccer_france_ligue_one',
      'soccer_uefa_champs_league'
    ]::text[],
    'season',
    '2025-08-01',
    '2026-06-30',
    72,
    'Euro Soccer',
    1
  ),
  (
    'ncaab-2025-26',
    'NCAA Basketball',
    'NCAA Men''s Basketball 2025-26',
    array['basketball_ncaab']::text[],
    'season',
    '2025-11-03',
    '2026-04-07',
    58,
    'NCAA Basketball',
    2
  ),
  (
    'ufc-329-2026',
    'UFC',
    'UFC 329: McGregor vs Holloway 2',
    array['mma_mixed_martial_arts']::text[],
    'marquee',
    '2026-07-11',
    '2026-07-11',
    95,
    'UFC',
    2
  ),
  (
    'masters-2026',
    'Masters Golf',
    'Masters Tournament 2026',
    array['golf_masters_tournament_winner']::text[],
    'tournament',
    '2026-04-09',
    '2026-04-12',
    70,
    'Masters',
    2
  ),
  (
    'pga-championship-2026',
    'PGA Championship',
    'PGA Championship 2026',
    array['golf_pga_championship_winner']::text[],
    'tournament',
    '2026-05-14',
    '2026-05-17',
    70,
    'PGA Championship',
    2
  ),
  (
    'us-open-golf-2026',
    'US Open Golf',
    'US Open Golf 2026',
    array['golf_us_open_winner']::text[],
    'tournament',
    '2026-06-18',
    '2026-06-21',
    72,
    'US Open Golf',
    2
  ),
  (
    'the-open-2026',
    'The Open',
    'The Open Championship 2026',
    array['golf_the_open_championship_winner']::text[],
    'tournament',
    '2026-07-16',
    '2026-07-19',
    72,
    'The Open',
    2
  ),
  (
    'boxing-marquee-2026',
    'Boxing',
    'Major boxing bouts (opportunistic)',
    array['boxing_boxing']::text[],
    'marquee',
    '2026-01-01',
    '2026-12-31',
    40,
    'Boxing',
    3
  ),
  (
    'winter-olympics-2026',
    'Winter Olympics',
    'Milano Cortina 2026 (manual / limited odds API)',
    array['winter_olympics_2026']::text[],
    'tournament',
    '2026-02-06',
    '2026-02-22',
    55,
    'Winter Olympics',
    3
  ),
  (
    'formula1-2026',
    'Formula 1',
    'F1 2026 season (calendar placeholder — not on Odds API h2h)',
    array['motorsport_formula1']::text[],
    'season',
    '2026-03-01',
    '2026-12-06',
    35,
    'Formula 1',
    3
  ),
  (
    'esports-opportunistic-2026',
    'Esports',
    'Esports (calendar placeholder — add sport keys when wired)',
    array['esports_lol']::text[],
    'season',
    '2026-01-01',
    '2026-12-31',
    30,
    'Esports',
    3
  )
on conflict (slug) do update set
  label_short = excluded.label_short,
  title = excluded.title,
  odds_sport_keys = excluded.odds_sport_keys,
  kind = excluded.kind,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  priority = excluded.priority,
  caption_prefix = excluded.caption_prefix,
  coverage_tier = excluded.coverage_tier,
  enabled = true;

-- Disable placeholders without live Odds API game markets until keys are confirmed
update public.lounge_sports_betting_calendar
set enabled = false
where slug in ('winter-olympics-2026', 'formula1-2026', 'esports-opportunistic-2026');

-- ---------------------------------------------------------------------------
-- RPC: today + list + save — include coverage_tier
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_sports_betting_calendar_today()
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
    select jsonb_agg(row_obj order by (row_obj->>'priority')::int desc, row_obj->>'label_short')
    from (
      select jsonb_build_object(
        'slug', c.slug,
        'label_short', c.label_short,
        'title', c.title,
        'odds_sport_keys', c.odds_sport_keys,
        'kind', c.kind,
        'priority', c.priority,
        'coverage_tier', c.coverage_tier,
        'caption_prefix', coalesce(c.caption_prefix, c.label_short),
        'start_date', c.start_date,
        'end_date', c.end_date
      ) as row_obj
      from public.lounge_sports_betting_calendar c
      where c.enabled
        and v_today between c.start_date and c.end_date
    ) sub
  ), '[]'::jsonb);
end;
$$;

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
        'coverage_tier', c.coverage_tier,
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
  v_tier int;
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
  v_tier := nullif(p_row->>'coverage_tier', '')::int;
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
  if v_tier is not null and v_tier not between 1 and 3 then raise exception 'coverage_tier must be 1, 2, or 3'; end if;

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
      coverage_tier = v_tier,
      caption_prefix = coalesce(v_prefix, v_label),
      enabled = v_enabled
    where id = v_id
    returning * into v_row;

    if not found then raise exception 'calendar row not found'; end if;
  else
    insert into public.lounge_sports_betting_calendar (
      slug, label_short, title, odds_sport_keys, kind, start_date, end_date,
      priority, coverage_tier, caption_prefix, enabled
    )
    values (
      v_slug, v_label, v_title, v_keys, v_kind, v_start, v_end,
      v_priority, v_tier, coalesce(v_prefix, v_label), v_enabled
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
      'coverage_tier', v_row.coverage_tier,
      'caption_prefix', v_row.caption_prefix,
      'enabled', v_row.enabled
    )
  );
exception
  when unique_violation then
    raise exception 'slug already exists: %', v_slug;
end;
$$;
