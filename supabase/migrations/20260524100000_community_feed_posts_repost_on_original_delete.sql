-- When an original post is deleted:
--   • plain repost feed cards pointing at it are removed
--   • quote repost rows are kept with repost_target_unavailable = true (embed tombstone in UI)

alter table public.community_feed_posts
  add column if not exists repost_target_unavailable boolean not null default false;

comment on column public.community_feed_posts.repost_target_unavailable is
  'True when this quote repost row lost its original post (deleted). Plain repost children are deleted instead.';

-- One-time cleanup: orphaned plain repost shells after prior ON DELETE SET NULL behavior.
delete from public.community_feed_posts child
where coalesce(child.is_plain_repost, false) = true
  and child.repost_of_post_id is null
  and child.repost_of_comment_id is null;

create or replace function public.community_feed_posts_before_delete_repost_children()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Plain repost cards are useless without the original — remove them.
  delete from public.community_feed_posts child
  where child.repost_of_post_id = old.id
    and coalesce(child.is_plain_repost, false) = true;

  -- Quote reposts: keep the reposter''s commentary; mark embed unavailable.
  update public.community_feed_posts child
  set repost_target_unavailable = true,
      repost_of_post_id = null
  where child.repost_of_post_id = old.id
    and coalesce(child.is_plain_repost, false) = false
    and child.repost_of_comment_id is null;

  return old;
end;
$$;

drop trigger if exists trg_community_feed_posts_before_delete_repost_children on public.community_feed_posts;
create trigger trg_community_feed_posts_before_delete_repost_children
  before delete on public.community_feed_posts
  for each row
  execute function public.community_feed_posts_before_delete_repost_children();
