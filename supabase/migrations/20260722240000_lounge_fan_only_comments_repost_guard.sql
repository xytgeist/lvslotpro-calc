-- Fan-only posts: hide comments from non-subs (except author/staff); block repost/quote/comment-repost.

begin;

-- ---------------------------------------------------------------------------
-- Comment visibility (SELECT on feed_comments)
-- ---------------------------------------------------------------------------
create or replace function public.lounge_viewer_can_read_feed_comment(p_comment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (
      select
        not coalesce(p.creator_fan_only, false)
        or public.has_creator_fan_sub((select auth.uid()), p.user_id)
        or p.user_id = (select auth.uid())
        or fc.user_id = (select auth.uid())
        or exists (
          select 1
          from public.profiles pr
          where pr.user_id = (select auth.uid())
            and pr.role in ('admin', 'moderator')
        )
      from public.feed_comments fc
      join public.community_feed_posts p on p.id = fc.post_id
      where fc.id = p_comment_id
        and fc.hidden_at is null
        and p.hidden_at is null
    ),
    false
  );
$$;

revoke all on function public.lounge_viewer_can_read_feed_comment(uuid) from public;
grant execute on function public.lounge_viewer_can_read_feed_comment(uuid) to authenticated;

comment on function public.lounge_viewer_can_read_feed_comment(uuid) is
  'True when the session may read this feed comment (fan-only parent requires sub, post author, comment author, or staff).';

drop policy if exists feed_comments_select_visible on public.feed_comments;
create policy feed_comments_select_visible on public.feed_comments
  for select to authenticated
  using (
    hidden_at is null
    and (
      user_id = (select auth.uid())
      or public.lounge_viewer_can_read_feed_comment(id)
    )
  );

-- ---------------------------------------------------------------------------
-- Block repost / quote / comment-repost of fan-only parent posts
-- ---------------------------------------------------------------------------
create or replace function public.community_feed_posts_block_fan_only_repost()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fan_only boolean := false;
begin
  if new.repost_of_post_id is not null then
    select coalesce(p.creator_fan_only, false)
      into v_fan_only
    from public.community_feed_posts p
    where p.id = new.repost_of_post_id;
    if v_fan_only then
      raise exception 'Subscribers-only posts cannot be reposted or quote reposted.'
        using errcode = '42501';
    end if;
  end if;

  if new.repost_of_comment_id is not null then
    select coalesce(p.creator_fan_only, false)
      into v_fan_only
    from public.feed_comments fc
    join public.community_feed_posts p on p.id = fc.post_id
    where fc.id = new.repost_of_comment_id;
    if v_fan_only then
      raise exception 'Comments on subscribers-only posts cannot be reposted.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_community_feed_posts_block_fan_only_repost on public.community_feed_posts;
create trigger trg_community_feed_posts_block_fan_only_repost
  before insert on public.community_feed_posts
  for each row
  execute function public.community_feed_posts_block_fan_only_repost();

commit;
