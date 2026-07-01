-- v2: fix post delete still failing with "tuple to be deleted was already modified…"
--
-- Root causes missed in 24110000:
--   1. Nested plain-repost DELETE re-ran BEFORE DELETE and overwrote lounge.post_delete_in_progress.
--   2. AFTER DELETE on nested plain-repost rows cleared the flag before the root row finished deleting.
--   3. post_likes CASCADE DELETE still decremented like_count on the row being deleted.

create or replace function public.lounge_post_delete_in_progress_id()
returns text
language sql
stable
as $$
  select nullif(trim(current_setting('lounge.post_delete_in_progress', true)), '');
$$;

create or replace function public.lounge_skip_denorm_bump_for_post(p_post_id uuid)
returns boolean
language sql
stable
as $$
  select public.lounge_post_delete_in_progress_id() is not null
    and p_post_id is not null
    and p_post_id::text = public.lounge_post_delete_in_progress_id();
$$;

create or replace function public.post_likes_touch_post_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if public.lounge_skip_denorm_bump_for_post(new.post_id) then
      return null;
    end if;
    perform set_config('lounge.denorm_feed_counters', '1', true);
    update public.community_feed_posts
      set like_count = like_count + 1
      where id = new.post_id;
    perform set_config('lounge.denorm_feed_counters', '', true);
  elsif tg_op = 'DELETE' then
    if public.lounge_skip_denorm_bump_for_post(old.post_id) then
      return null;
    end if;
    perform set_config('lounge.denorm_feed_counters', '1', true);
    update public.community_feed_posts
      set like_count = greatest(0, like_count - 1)
      where id = old.post_id;
    perform set_config('lounge.denorm_feed_counters', '', true);
  end if;
  return null;
exception when others then
  perform set_config('lounge.denorm_feed_counters', '', true);
  raise;
end;
$$;

create or replace function public.community_feed_posts_touch_repost_count_from_quotes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.repost_of_post_id is not null
      and new.hidden_at is null
      and not public.lounge_skip_denorm_bump_for_post(new.repost_of_post_id) then
      perform set_config('lounge.denorm_feed_counters', '1', true);
      update public.community_feed_posts
        set repost_count = repost_count + 1
        where id = new.repost_of_post_id;
      perform set_config('lounge.denorm_feed_counters', '', true);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.repost_of_post_id is not null
      and old.hidden_at is null
      and not public.lounge_skip_denorm_bump_for_post(old.repost_of_post_id) then
      perform set_config('lounge.denorm_feed_counters', '1', true);
      update public.community_feed_posts
        set repost_count = greatest(0, repost_count - 1)
        where id = old.repost_of_post_id;
      perform set_config('lounge.denorm_feed_counters', '', true);
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.repost_of_post_id is distinct from new.repost_of_post_id then
      if old.repost_of_post_id is not null
        and old.hidden_at is null
        and not public.lounge_skip_denorm_bump_for_post(old.repost_of_post_id) then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = greatest(0, repost_count - 1)
          where id = old.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      end if;
      if new.repost_of_post_id is not null
        and new.hidden_at is null
        and not public.lounge_skip_denorm_bump_for_post(new.repost_of_post_id) then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = repost_count + 1
          where id = new.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      end if;
      return new;
    end if;

    if new.repost_of_post_id is not null then
      if old.hidden_at is null and new.hidden_at is not null
        and not public.lounge_skip_denorm_bump_for_post(new.repost_of_post_id) then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = greatest(0, repost_count - 1)
          where id = new.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      elsif old.hidden_at is not null and new.hidden_at is null
        and not public.lounge_skip_denorm_bump_for_post(new.repost_of_post_id) then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = repost_count + 1
          where id = new.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      end if;
    end if;
    return new;
  end if;
  return null;
exception when others then
  perform set_config('lounge.denorm_feed_counters', '', true);
  raise;
end;
$$;

create or replace function public.feed_comments_bump_ancestor_counts(
  p_post_id uuid,
  p_parent_id uuid,
  p_delta integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur uuid := p_parent_id;
begin
  if p_delta = 0 or p_post_id is null then
    return;
  end if;

  if public.lounge_skip_denorm_bump_for_post(p_post_id) then
    return;
  end if;

  perform set_config('lounge.denorm_feed_counters', '1', true);

  update public.community_feed_posts
    set comment_count = greatest(0, comment_count + p_delta)
    where id = p_post_id;

  while cur is not null loop
    update public.feed_comments
      set comment_count = greatest(0, comment_count + p_delta)
      where id = cur;
    select c.parent_id into cur
    from public.feed_comments c
    where c.id = cur;
  end loop;

  perform set_config('lounge.denorm_feed_counters', '', true);
exception
  when others then
    perform set_config('lounge.denorm_feed_counters', '', true);
    raise;
end;
$$;

create or replace function public.community_feed_posts_before_delete_repost_children()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.lounge_post_delete_in_progress_id() is null then
    perform set_config('lounge.post_delete_in_progress', old.id::text, true);
  end if;

  delete from public.community_feed_posts child
  where child.repost_of_post_id = old.id
    and coalesce(child.is_plain_repost, false) = true;

  update public.community_feed_posts child
  set repost_target_unavailable = true
  where child.repost_of_post_id = old.id
    and coalesce(child.is_plain_repost, false) = false
    and child.repost_of_comment_id is null;

  return old;
exception when others then
  if old.id::text = public.lounge_post_delete_in_progress_id() then
    perform set_config('lounge.post_delete_in_progress', '', true);
  end if;
  raise;
end;
$$;

create or replace function public.community_feed_posts_after_delete_clear_post_delete_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.id::text = public.lounge_post_delete_in_progress_id() then
    perform set_config('lounge.post_delete_in_progress', '', true);
  end if;
  return old;
end;
$$;
