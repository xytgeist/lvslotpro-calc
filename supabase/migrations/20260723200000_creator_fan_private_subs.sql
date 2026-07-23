-- Creator fan rooms: Private Subs catalog, topic keywords, creator room metadata RPCs.

begin;

alter table public.chat_rooms
  add column if not exists topic_keywords text;

comment on column public.chat_rooms.topic_keywords is
  'Comma-separated topic tags for creator_fan room discover search (Private Subs tab).';

-- Default title remains @{handle} fan room at create time (creator_fan_ensure_room).
create or replace function public.creator_fan_ensure_room(p_creator_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_handle text;
  v_title text;
  v_slug text;
begin
  if p_creator_user_id is null then
    raise exception 'creator user id required';
  end if;

  select cmp.fan_room_id into v_room_id
  from public.creator_monetization_profiles cmp
  where cmp.user_id = p_creator_user_id;

  if v_room_id is not null then
    return v_room_id;
  end if;

  select p.handle into v_handle
  from public.profiles p
  where p.user_id = p_creator_user_id;

  if v_handle is null or length(trim(v_handle)) = 0 then
    raise exception 'Set a profile handle before enabling fan subscriptions';
  end if;

  v_slug := 'fan-' || lower(trim(v_handle));
  v_title := '@' || trim(v_handle) || ' fan room';

  insert into public.chat_rooms (
    kind,
    slug,
    title,
    topic_key,
    max_members,
    subscriber_only,
    created_by,
    creator_user_id
  )
  values (
    'creator_fan',
    v_slug,
    v_title,
    'creator_fan:' || p_creator_user_id::text,
    500,
    false,
    p_creator_user_id,
    p_creator_user_id
  )
  returning id into v_room_id;

  insert into public.chat_room_members (room_id, user_id, role)
  values (v_room_id, p_creator_user_id, 'admin')
  on conflict (room_id, user_id) do update set role = 'admin';

  update public.creator_monetization_profiles
  set fan_room_id = v_room_id,
      updated_at = now()
  where user_id = p_creator_user_id;

  return v_room_id;
end;
$$;

create or replace function public.creator_fan_update_room(
  p_title text,
  p_description text,
  p_topic_keywords text,
  p_avatar_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room_id uuid;
  v_title text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select cmp.fan_room_id into v_room_id
  from public.creator_monetization_profiles cmp
  where cmp.user_id = v_uid;

  if v_room_id is null then
    raise exception 'Fan room not set up yet';
  end if;

  v_title := left(trim(coalesce(p_title, '')), 80);
  if length(v_title) < 1 then
    raise exception 'Room name is required';
  end if;

  update public.chat_rooms r
  set
    title = v_title,
    description = left(trim(coalesce(p_description, '')), 500),
    topic_keywords = left(trim(coalesce(p_topic_keywords, '')), 500),
    avatar_url = case
      when p_avatar_url is not null then nullif(left(trim(p_avatar_url), 2048), '')
      else r.avatar_url
    end
  where r.id = v_room_id
    and r.kind = 'creator_fan'
    and r.creator_user_id = v_uid;

  if not found then
    raise exception 'Fan room not found';
  end if;

  return public.get_my_creator_fan_monetization();
end;
$$;

revoke all on function public.creator_fan_update_room(text, text, text, text) from public;
grant execute on function public.creator_fan_update_room(text, text, text, text) to authenticated;

create or replace function public.list_creator_fan_private_subs(p_search text default '')
returns table (
  room_id uuid,
  creator_user_id uuid,
  title text,
  description text,
  topic_keywords text,
  avatar_url text,
  creator_handle text,
  creator_display_name text,
  creator_avatar_url text,
  is_member boolean,
  is_host boolean,
  has_unread boolean,
  last_message_at timestamptz,
  last_message_preview text
)
language sql
stable
security definer
set search_path = public
as $$
  with v as (
    select auth.uid() as uid
  ),
  base as (
    select
      r.id as room_id,
      r.creator_user_id,
      r.title,
      r.description,
      r.topic_keywords,
      r.avatar_url,
      p.handle as creator_handle,
      p.display_name as creator_display_name,
      p.avatar_url as creator_avatar_url,
      r.last_message_at,
      r.last_message_preview,
      r.last_message_sender_id,
      (
        exists (
          select 1
          from public.chat_room_members m
          where m.room_id = r.id
            and m.user_id = (select uid from v)
        )
      ) as is_member,
      (r.creator_user_id = (select uid from v)) as is_host
    from public.chat_rooms r
    inner join public.creator_monetization_profiles cmp
      on cmp.fan_room_id = r.id
      and cmp.user_id = r.creator_user_id
    inner join public.profiles p on p.user_id = r.creator_user_id
    where r.kind = 'creator_fan'
      and cmp.enabled
      and cmp.connect_onboarding_complete
      and p.banned_at is null
      and public.creator_fan_offer_is_complete(
        cmp.offer_intro,
        cmp.offer_private_posts,
        cmp.offer_fan_chat
      )
      and (
        coalesce(trim(p_search), '') = ''
        or r.title ilike '%' || trim(p_search) || '%'
        or coalesce(r.description, '') ilike '%' || trim(p_search) || '%'
        or coalesce(r.topic_keywords, '') ilike '%' || trim(p_search) || '%'
      )
  )
  select
    b.room_id,
    b.creator_user_id,
    b.title,
    b.description,
    b.topic_keywords,
    b.avatar_url,
    b.creator_handle,
    b.creator_display_name,
    b.creator_avatar_url,
    b.is_member,
    b.is_host,
    (
      b.is_member
      and b.last_message_at is not null
      and (b.last_message_sender_id is distinct from (select uid from v))
      and (
        (
          select m.last_read_at
          from public.chat_room_members m
          where m.room_id = b.room_id
            and m.user_id = (select uid from v)
          limit 1
        ) is null
        or b.last_message_at > (
          select m.last_read_at
          from public.chat_room_members m
          where m.room_id = b.room_id
            and m.user_id = (select uid from v)
          limit 1
        )
      )
    ) as has_unread,
    b.last_message_at,
    b.last_message_preview
  from base b
  order by b.is_member desc, b.last_message_at desc nulls last, b.title asc;
$$;

revoke all on function public.list_creator_fan_private_subs(text) from public;
grant execute on function public.list_creator_fan_private_subs(text) to authenticated;

create or replace function public.get_my_creator_fan_monetization()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'fan_tier_key', cmp.fan_tier_key,
        'msrp_cents', tft.msrp_cents,
        'enabled', cmp.enabled,
        'connect_onboarding_complete', cmp.connect_onboarding_complete,
        'stripe_connect_account_id', cmp.stripe_connect_account_id,
        'fan_room_id', cmp.fan_room_id,
        'handle', p.handle,
        'offer_headline', cmp.offer_headline,
        'offer_intro', cmp.offer_intro,
        'offer_private_posts', cmp.offer_private_posts,
        'offer_fan_chat', cmp.offer_fan_chat,
        'offer_complete', public.creator_fan_offer_is_complete(
          cmp.offer_intro,
          cmp.offer_private_posts,
          cmp.offer_fan_chat
        ),
        'fan_room_title', fr.title,
        'fan_room_description', fr.description,
        'fan_room_topic_keywords', fr.topic_keywords,
        'fan_room_avatar_url', fr.avatar_url
      )
      from public.creator_monetization_profiles cmp
      join public.creator_fan_tiers tft on tft.tier_key = cmp.fan_tier_key
      join public.profiles p on p.user_id = cmp.user_id
      left join public.chat_rooms fr on fr.id = cmp.fan_room_id
      where cmp.user_id = auth.uid()
    ),
    jsonb_build_object(
      'fan_tier_key', 'fan-tier-999',
      'msrp_cents', 999,
      'enabled', false,
      'connect_onboarding_complete', false,
      'stripe_connect_account_id', null,
      'fan_room_id', null,
      'handle', (select handle from public.profiles where user_id = auth.uid()),
      'offer_headline', null,
      'offer_intro', null,
      'offer_private_posts', null,
      'offer_fan_chat', null,
      'offer_complete', false,
      'fan_room_title', null,
      'fan_room_description', null,
      'fan_room_topic_keywords', null,
      'fan_room_avatar_url', null
    )
  );
$$;

commit;
