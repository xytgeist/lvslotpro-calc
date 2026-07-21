-- Creator fan subscription offer copy (creator form + subscriber preview).
-- Spec: docs/entitlements-matrix.md §5.

begin;

alter table public.creator_monetization_profiles
  add column if not exists offer_headline text,
  add column if not exists offer_intro text,
  add column if not exists offer_private_posts text,
  add column if not exists offer_fan_chat text;

alter table public.creator_monetization_profiles
  drop constraint if exists creator_monetization_profiles_offer_headline_len;
alter table public.creator_monetization_profiles
  add constraint creator_monetization_profiles_offer_headline_len
  check (offer_headline is null or char_length(offer_headline) <= 120);

alter table public.creator_monetization_profiles
  drop constraint if exists creator_monetization_profiles_offer_intro_len;
alter table public.creator_monetization_profiles
  add constraint creator_monetization_profiles_offer_intro_len
  check (offer_intro is null or char_length(offer_intro) <= 800);

alter table public.creator_monetization_profiles
  drop constraint if exists creator_monetization_profiles_offer_private_posts_len;
alter table public.creator_monetization_profiles
  add constraint creator_monetization_profiles_offer_private_posts_len
  check (offer_private_posts is null or char_length(offer_private_posts) <= 2000);

alter table public.creator_monetization_profiles
  drop constraint if exists creator_monetization_profiles_offer_fan_chat_len;
alter table public.creator_monetization_profiles
  add constraint creator_monetization_profiles_offer_fan_chat_len
  check (offer_fan_chat is null or char_length(offer_fan_chat) <= 2000);

comment on column public.creator_monetization_profiles.offer_headline is
  'Optional subscriber-facing title for the fan sub pitch (Settings form).';
comment on column public.creator_monetization_profiles.offer_intro is
  'Short overview of the fan subscription (required before going live).';
comment on column public.creator_monetization_profiles.offer_private_posts is
  'What the creator offers in fan-only / private Lounge posts.';
comment on column public.creator_monetization_profiles.offer_fan_chat is
  'What the creator offers in the fan group chat room.';

create or replace function public.creator_fan_offer_is_complete(
  p_intro text,
  p_private_posts text,
  p_fan_chat text
)
returns boolean
language sql
immutable
as $$
  select length(trim(coalesce(p_intro, ''))) >= 20
    and (
      length(trim(coalesce(p_private_posts, ''))) >= 20
      or length(trim(coalesce(p_fan_chat, ''))) >= 20
    );
$$;

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
        )
      )
      from public.creator_monetization_profiles cmp
      join public.creator_fan_tiers tft on tft.tier_key = cmp.fan_tier_key
      join public.profiles p on p.user_id = cmp.user_id
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
      'offer_complete', false
    )
  );
$$;

create or replace function public.get_creator_fan_offer(p_creator_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'creator_user_id', p.user_id,
        'handle', p.handle,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url,
        'enabled', cmp.enabled and cmp.connect_onboarding_complete,
        'fan_tier_key', cmp.fan_tier_key,
        'msrp_cents', tft.msrp_cents,
        'offer_headline', nullif(trim(cmp.offer_headline), ''),
        'offer_intro', cmp.offer_intro,
        'offer_private_posts', cmp.offer_private_posts,
        'offer_fan_chat', cmp.offer_fan_chat,
        'offer_complete', public.creator_fan_offer_is_complete(
          cmp.offer_intro,
          cmp.offer_private_posts,
          cmp.offer_fan_chat
        )
      )
      from public.creator_monetization_profiles cmp
      join public.creator_fan_tiers tft on tft.tier_key = cmp.fan_tier_key
      join public.profiles p on p.user_id = cmp.user_id
      where cmp.user_id = p_creator_user_id
        and cmp.enabled
        and cmp.connect_onboarding_complete
        and p.banned_at is null
        and public.creator_fan_offer_is_complete(
          cmp.offer_intro,
          cmp.offer_private_posts,
          cmp.offer_fan_chat
        )
    ),
    null::jsonb
  );
$$;

create or replace function public.creator_fan_save_offer(
  p_offer_headline text,
  p_offer_intro text,
  p_offer_private_posts text,
  p_offer_fan_chat text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_headline text := nullif(trim(coalesce(p_offer_headline, '')), '');
  v_intro text := nullif(trim(coalesce(p_offer_intro, '')), '');
  v_posts text := nullif(trim(coalesce(p_offer_private_posts, '')), '');
  v_chat text := nullif(trim(coalesce(p_offer_fan_chat, '')), '');
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if v_headline is not null and char_length(v_headline) > 120 then
    raise exception 'Headline is too long (120 max)';
  end if;
  if v_intro is not null and char_length(v_intro) > 800 then
    raise exception 'Overview is too long (800 max)';
  end if;
  if v_posts is not null and char_length(v_posts) > 2000 then
    raise exception 'Private posts section is too long (2000 max)';
  end if;
  if v_chat is not null and char_length(v_chat) > 2000 then
    raise exception 'Fan chat section is too long (2000 max)';
  end if;

  insert into public.creator_monetization_profiles (user_id, fan_tier_key, enabled)
  values (v_uid, 'fan-tier-999', false)
  on conflict (user_id) do nothing;

  update public.creator_monetization_profiles
  set offer_headline = v_headline,
      offer_intro = v_intro,
      offer_private_posts = v_posts,
      offer_fan_chat = v_chat,
      updated_at = now()
  where user_id = v_uid;

  return public.get_my_creator_fan_monetization();
end;
$$;

grant execute on function public.creator_fan_save_offer(text, text, text, text) to authenticated;

create or replace function public.creator_fan_save_monetization(
  p_fan_tier_key text,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_handle text;
  v_room_id uuid;
  v_row public.creator_monetization_profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if p_fan_tier_key is null or not exists (
    select 1 from public.creator_fan_tiers t
    where t.tier_key = p_fan_tier_key and t.active
  ) then
    raise exception 'Invalid fan tier';
  end if;

  select handle into v_handle from public.profiles where user_id = v_uid;
  if v_handle is null or length(trim(v_handle)) = 0 then
    raise exception 'Set a profile handle before fan subscriptions';
  end if;

  insert into public.creator_monetization_profiles (user_id, fan_tier_key, enabled)
  values (v_uid, p_fan_tier_key, false)
  on conflict (user_id) do update set
    fan_tier_key = excluded.fan_tier_key,
    updated_at = now();

  select * into v_row from public.creator_monetization_profiles where user_id = v_uid;

  if p_enabled then
    if not v_row.connect_onboarding_complete or v_row.stripe_connect_account_id is null then
      raise exception 'Complete Stripe Connect onboarding first';
    end if;

    if not public.creator_fan_offer_is_complete(
      v_row.offer_intro,
      v_row.offer_private_posts,
      v_row.offer_fan_chat
    ) then
      raise exception 'Complete your fan subscription offer (overview + at least one detail section) before going live';
    end if;

    v_room_id := public.creator_fan_ensure_room(v_uid);

    update public.creator_monetization_profiles
    set enabled = true,
        fan_room_id = coalesce(fan_room_id, v_room_id),
        updated_at = now()
    where user_id = v_uid;
  else
    update public.creator_monetization_profiles
    set enabled = false,
        updated_at = now()
    where user_id = v_uid;
  end if;

  return public.get_my_creator_fan_monetization();
end;
$$;

commit;
