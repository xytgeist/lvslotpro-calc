-- Run in Supabase SQL editor after `feed_phase_a_profiles_public_read.sql`.
-- 1) Only moderators/admins may insert with pinned = true (everyone else defaults false).
--
-- Pin count (max two visible pinned posts) is enforced by
-- `community_feed_posts_enforce_max_two_pins` in feed_phase_a or
-- `supabase/feed_max_two_pins_migration.sql` on existing databases.

drop policy if exists community_feed_posts_insert_authed on public.community_feed_posts;

create policy community_feed_posts_insert_authed on public.community_feed_posts
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.banned_at is not null
    )
    and (
      not coalesce(pinned, false)
      or public.current_user_has_staff_role()
    )
  );
