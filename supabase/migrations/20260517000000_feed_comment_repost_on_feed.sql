-- Comment reposts as feed cards.
--
-- Previously comment reposts only wrote to feed_comment_reposts (count tracking only, never surfaced
-- as a feed card). This migration lets a plain repost of a comment create a community_feed_posts row
-- owned by the reposter, sorted by when the repost happened, with the original comment's content
-- rendered inside the card.
--
-- repost_count on feed_comments is maintained by the NEW trigger below
-- (community_feed_posts insert/delete where repost_of_comment_id is set).
-- The legacy feed_comment_reposts trigger still fires for any old rows that exist.
--
-- Apply on test then prod after:
--   supabase/migrations/20260515190000_feed_comment_interactions.sql
--   supabase/lounge_plain_reposts.sql

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------
alter table public.community_feed_posts
  add column if not exists repost_of_comment_id uuid
    references public.feed_comments (id) on delete cascade;

comment on column public.community_feed_posts.repost_of_comment_id is
  'Set when this feed card is a plain repost of a comment; references feed_comments.id (cascade delete).';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists community_feed_posts_repost_of_comment_idx
  on public.community_feed_posts (repost_of_comment_id)
  where repost_of_comment_id is not null;

-- One plain comment-repost feed card per (reposter, comment).
create unique index if not exists community_feed_posts_one_plain_comment_repost_per_user
  on public.community_feed_posts (user_id, repost_of_comment_id)
  where repost_of_comment_id is not null
    and coalesce(is_plain_repost, false) = true;

-- ---------------------------------------------------------------------------
-- Count trigger on community_feed_posts for comment reposts
-- ---------------------------------------------------------------------------
create or replace function public.community_feed_posts_comment_repost_touch_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.repost_of_comment_id is not null then
    update public.feed_comments
      set repost_count = repost_count + 1
      where id = new.repost_of_comment_id;
  elsif tg_op = 'DELETE' and old.repost_of_comment_id is not null then
    update public.feed_comments
      set repost_count = greatest(0, repost_count - 1)
      where id = old.repost_of_comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_community_feed_posts_comment_repost_touch on public.community_feed_posts;
create trigger trg_community_feed_posts_comment_repost_touch
  after insert or delete on public.community_feed_posts
  for each row
  execute function public.community_feed_posts_comment_repost_touch_count();

-- ---------------------------------------------------------------------------
-- Updated validate trigger
-- Adds repost_of_comment_id validation; existing repost_of_post_id logic unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.community_feed_posts_validate_quote_repost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_images boolean;
begin
  -- ── Comment repost ────────────────────────────────────────────────────────
  if new.repost_of_comment_id is not null then
    -- Cannot mix post and comment repost targets
    if new.repost_of_post_id is not null then
      raise exception 'Cannot set both repost_of_post_id and repost_of_comment_id';
    end if;
    -- Must be flagged as a plain repost (no quote text for comment reposts)
    if not coalesce(new.is_plain_repost, false) then
      raise exception 'Comment reposts must have is_plain_repost = true';
    end if;
    -- Target comment must exist and not be hidden
    if not exists (
      select 1 from public.feed_comments c
      where c.id = new.repost_of_comment_id and c.hidden_at is null
    ) then
      raise exception 'Comment not found or hidden';
    end if;
    return new;
  end if;

  -- ── Post repost (original logic) ─────────────────────────────────────────
  if new.repost_of_post_id is null then
    return new;
  end if;

  if new.repost_of_post_id = new.id then
    raise exception 'Cannot quote-repost a post onto itself';
  end if;

  if not exists (
    select 1
    from public.community_feed_posts c
    where c.id = new.repost_of_post_id
      and c.hidden_at is null
  ) then
    if exists (select 1 from public.community_feed_posts c where c.id = new.repost_of_post_id) then
      raise exception 'Cannot quote a hidden post';
    else
      raise exception 'Original post not found';
    end if;
  end if;

  if coalesce(new.is_plain_repost, false) = true then
    if length(trim(coalesce(new.caption, ''))) > 0 then
      raise exception 'Plain repost must have an empty caption';
    end if;
  else
    has_images :=
      new.image_urls is not null
      and jsonb_typeof(new.image_urls) = 'array'
      and jsonb_array_length(new.image_urls) > 0;

    if length(trim(coalesce(new.caption, ''))) < 1 then
      if not (
        has_images
        or length(trim(coalesce(new.media_url, ''))) > 0
        or length(trim(coalesce(new.gif_url, ''))) > 0
      ) then
        raise exception 'Quote repost requires a comment or media (image or GIF)';
      end if;
    end if;
  end if;

  return new;
end;
$$;
