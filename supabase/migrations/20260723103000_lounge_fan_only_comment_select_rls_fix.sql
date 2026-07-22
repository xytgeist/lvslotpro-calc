-- Fix feed_comments INSERT … RETURNING: SELECT policy called lounge_viewer_can_read_feed_comment,
-- which re-entered RLS on feed_comments (no row_security off) and blocked the new row.

begin;

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

commit;
