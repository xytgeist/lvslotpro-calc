-- Fix: deleting an original post failed when reposts and/or comments existed because
-- nested DELETE/UPDATE (repost cleanup + comment CASCADE) fired denormalized counter
-- triggers that UPDATE the row being deleted ("tuple to be deleted was already modified…").
--
-- lounge.post_delete_in_progress = deleted post id for the whole delete command
-- (BEFORE cleanup → CASCADE comments → AFTER clear).

create or replace function public.community_feed_posts_touch_repost_count_from_quotes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deleting_post_id text := current_setting('lounge.post_delete_in_progress', true);
begin
  if deleting_post_id <> '' then
    if tg_op = 'DELETE'
      and old.repost_of_post_id is not null
      and old.repost_of_post_id::text = deleting_post_id then
      return old;
    elsif tg_op = 'UPDATE'
      and (
        (old.repost_of_post_id is not null and old.repost_of_post_id::text = deleting_post_id)
        or (new.repost_of_post_id is not null and new.repost_of_post_id::text = deleting_post_id)
      ) then
      return new;
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.repost_of_post_id is not null and new.hidden_at is null then
      perform set_config('lounge.denorm_feed_counters', '1', true);
      update public.community_feed_posts
        set repost_count = repost_count + 1
        where id = new.repost_of_post_id;
      perform set_config('lounge.denorm_feed_counters', '', true);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.repost_of_post_id is not null and old.hidden_at is null then
      perform set_config('lounge.denorm_feed_counters', '1', true);
      update public.community_feed_posts
        set repost_count = greatest(0, repost_count - 1)
        where id = old.repost_of_post_id;
      perform set_config('lounge.denorm_feed_counters', '', true);
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.repost_of_post_id is distinct from new.repost_of_post_id then
      if old.repost_of_post_id is not null and old.hidden_at is null then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = greatest(0, repost_count - 1)
          where id = old.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      end if;
      if new.repost_of_post_id is not null and new.hidden_at is null then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = repost_count + 1
          where id = new.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      end if;
      return new;
    end if;

    if new.repost_of_post_id is not null then
      if old.hidden_at is null and new.hidden_at is not null then
        perform set_config('lounge.denorm_feed_counters', '1', true);
        update public.community_feed_posts
          set repost_count = greatest(0, repost_count - 1)
          where id = new.repost_of_post_id;
        perform set_config('lounge.denorm_feed_counters', '', true);
      elsif old.hidden_at is not null and new.hidden_at is null then
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
  deleting_post_id text := current_setting('lounge.post_delete_in_progress', true);
begin
  if p_delta = 0 or p_post_id is null then
    return;
  end if;

  if deleting_post_id <> '' and p_post_id::text = deleting_post_id then
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
  perform set_config('lounge.post_delete_in_progress', old.id::text, true);

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
  perform set_config('lounge.post_delete_in_progress', '', true);
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
  perform set_config('lounge.post_delete_in_progress', '', true);
  return old;
end;
$$;

drop trigger if exists trg_community_feed_posts_after_delete_clear_post_delete_flag on public.community_feed_posts;
create trigger trg_community_feed_posts_after_delete_clear_post_delete_flag
  after delete on public.community_feed_posts
  for each row
  execute function public.community_feed_posts_after_delete_clear_post_delete_flag();
