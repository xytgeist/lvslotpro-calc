-- Profile Posts tab: author may pin one of their own root posts to the top.
-- Separate from lounge staff `pinned` (home-feed announcements).

alter table public.community_feed_posts
  add column if not exists profile_pinned_at timestamptz;

comment on column public.community_feed_posts.profile_pinned_at is
  'When set, this root post is pinned to the top of the author profile Posts tab. At most one per user_id among visible posts.';

create unique index if not exists community_feed_posts_one_profile_pin_per_user_uidx
  on public.community_feed_posts (user_id)
  where profile_pinned_at is not null
    and hidden_at is null
    and thread_root_id is null;

create or replace function public.lounge_set_profile_pin(p_post_id uuid, p_pinned boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.community_feed_posts%rowtype;
  v_pinned_at timestamptz;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  if p_post_id is null then
    raise exception 'post id required';
  end if;

  select *
  into v_row
  from public.community_feed_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'post not found';
  end if;

  if v_row.user_id is distinct from v_uid then
    raise exception 'own posts only';
  end if;

  if v_row.hidden_at is not null then
    raise exception 'cannot pin a hidden post';
  end if;

  if v_row.thread_root_id is not null then
    raise exception 'cannot pin a thread part';
  end if;

  if coalesce(v_row.is_plain_repost, false) then
    raise exception 'cannot pin a plain repost';
  end if;

  if coalesce(p_pinned, false) then
    update public.community_feed_posts
    set profile_pinned_at = null
    where user_id = v_uid
      and profile_pinned_at is not null
      and id is distinct from p_post_id;

    v_pinned_at := now();
    update public.community_feed_posts
    set profile_pinned_at = v_pinned_at
    where id = p_post_id
    returning * into v_row;
  else
    v_pinned_at := null;
    update public.community_feed_posts
    set profile_pinned_at = null
    where id = p_post_id
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'profile_pinned_at', v_row.profile_pinned_at,
    'pinned', coalesce(p_pinned, false)
  );
end;
$$;

revoke all on function public.lounge_set_profile_pin(uuid, boolean) from public;
grant execute on function public.lounge_set_profile_pin(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
