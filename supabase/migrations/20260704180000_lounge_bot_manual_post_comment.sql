-- Bot portal: admin publish feed posts + comments as a bot account (Scott Share, etc.).

create or replace function public.admin_lounge_bot_publish_post(
  p_bot_user_id uuid,
  p_caption text,
  p_category_pills text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bot public.lounge_bot_accounts%rowtype;
  v_cap text;
  v_pills text[];
  v_post_id uuid;
  v_allowed text[] := array[
    'ap_slots', 'ap_tables', 'poker', 'gaming', 'sports', 'tabletop',
    'investing', 'trading', 'stocks', 'crypto', 'collectibles'
  ];
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  select * into v_bot
  from public.lounge_bot_accounts a
  where a.user_id = p_bot_user_id;
  if not found then
    raise exception 'bot not found';
  end if;

  v_cap := left(trim(coalesce(p_caption, '')), 500);
  if char_length(v_cap) < 1 then
    raise exception 'caption required';
  end if;

  select coalesce(array(
    select distinct slug
    from unnest(
      case
        when p_category_pills is not null and cardinality(p_category_pills) > 0 then
          p_category_pills
        else
          coalesce(v_bot.category_pills_default, '{}'::text[])
      end
    ) as slug
    where slug = any(v_allowed)
    limit 3
  ), '{}'::text[])
  into v_pills;

  insert into public.community_feed_posts (
    user_id, caption, game_title, game_slug, category_pills
  ) values (
    p_bot_user_id, v_cap, '', null, v_pills
  )
  returning id into v_post_id;

  insert into public.lounge_bot_publish_log (
    bot_user_id, post_id, caption, status, post_kind
  ) values (
    p_bot_user_id, v_post_id, v_cap, 'published', 'other'
  );

  update public.lounge_bot_accounts
  set last_publish_at = now()
  where user_id = p_bot_user_id;

  return jsonb_build_object(
    'ok', true,
    'post_id', v_post_id,
    'caption', v_cap,
    'category_pills', v_pills
  );
end;
$$;

revoke all on function public.admin_lounge_bot_publish_post(uuid, text, text[]) from public;
grant execute on function public.admin_lounge_bot_publish_post(uuid, text, text[]) to authenticated;

comment on function public.admin_lounge_bot_publish_post(uuid, text, text[]) is
  'Admin bot portal: publish a manual feed post as the bot user (bypasses auth.uid insert RLS).';

-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_post_comment(
  p_bot_user_id uuid,
  p_post_id uuid,
  p_body text,
  p_parent_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_body text;
  v_comment_id uuid;
  v_post_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  if not exists (
    select 1 from public.lounge_bot_accounts a where a.user_id = p_bot_user_id
  ) then
    raise exception 'bot not found';
  end if;

  v_body := left(trim(coalesce(p_body, '')), 500);
  if char_length(trim(v_body)) < 1 then
    raise exception 'comment body required';
  end if;

  select c.user_id into v_post_user_id
  from public.community_feed_posts c
  where c.id = p_post_id
    and c.hidden_at is null;
  if v_post_user_id is null then
    raise exception 'post not found';
  end if;
  if v_post_user_id is distinct from p_bot_user_id then
    raise exception 'post does not belong to this bot';
  end if;

  if p_parent_id is not null then
    if not exists (
      select 1
      from public.feed_comments fc
      where fc.id = p_parent_id
        and fc.post_id = p_post_id
        and fc.hidden_at is null
    ) then
      raise exception 'parent comment not found on this post';
    end if;
  end if;

  insert into public.feed_comments (post_id, user_id, parent_id, body)
  values (p_post_id, p_bot_user_id, p_parent_id, v_body)
  returning id into v_comment_id;

  return jsonb_build_object(
    'ok', true,
    'comment_id', v_comment_id,
    'post_id', p_post_id,
    'parent_id', p_parent_id
  );
end;
$$;

revoke all on function public.admin_lounge_bot_post_comment(uuid, uuid, text, uuid) from public;
grant execute on function public.admin_lounge_bot_post_comment(uuid, uuid, text, uuid) to authenticated;

comment on function public.admin_lounge_bot_post_comment(uuid, uuid, text, uuid) is
  'Admin bot portal: comment on a bot-owned post as the bot (reply to thread or top-level).';
