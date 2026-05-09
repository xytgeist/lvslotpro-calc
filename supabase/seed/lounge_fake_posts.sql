-- Seed synthetic Lounge posts for test pagination/pinned behavior.
-- Safe to run multiple times; each run inserts a fresh batch.

with source_users as (
  select user_id
  from (
    select p.user_id
    from public.profiles p
    where p.banned_at is null
    union
    select u.id as user_id
    from auth.users u
  ) su
  limit 6
),
seed_rows as (
  select
    su.user_id,
    gs.n as seq_no,
    case (gs.n % 8)
      when 0 then 'AGS Must Hit By'
      when 1 then 'IGT Must Hit By'
      when 2 then 'Ainsworth Must Hit By'
      when 3 then 'Buffalo Link'
      when 4 then 'Phoenix Link'
      when 5 then 'Stack Up Pays'
      when 6 then 'Lightning Buffalo Link'
      else 'General Lounge'
    end as game_title,
    case (gs.n % 8)
      when 0 then 'ags-must-hit-by'
      when 1 then 'igt-must-hit-by'
      when 2 then 'ainsworth-must-hit-by'
      when 3 then 'buffalo-link'
      when 4 then 'phoenix-link'
      when 5 then 'stack-up-pays'
      when 6 then 'lightning-buffalo-link'
      else null
    end as game_slug
  from source_users su
  cross join generate_series(1, 10) as gs(n)
),
inserted as (
  insert into public.community_feed_posts (
    user_id,
    game_slug,
    game_title,
    caption,
    created_at,
    like_count,
    comment_count
  )
  select
    sr.user_id,
    sr.game_slug,
    sr.game_title,
    left(
      case (sr.seq_no % 6)
        when 0 then 'Meter moved fast on this bank. Anyone seeing same trend tonight?'
        when 1 then 'Quick floor note: decent traffic and strong bonus pacing this hour.'
        when 2 then 'Testing caption fallback and timeline spacing with seeded content.'
        when 3 then 'Would you stay on this machine or rotate after this setup?'
        when 4 then 'Logging a sample post to validate pagination and counts.'
        else 'Synthetic lounge seed post for UI and query testing.'
      end,
      280
    ),
    now() - ((sr.seq_no * 7 + (row_number() over ()) * 3) || ' minutes')::interval,
    (sr.seq_no * 3) % 28,
    (sr.seq_no * 2) % 11
  from seed_rows sr
  returning id
)
select count(*) as inserted_posts from inserted;

-- Ensure exactly one visible pinned post exists for feed testing.
update public.community_feed_posts
set pinned = false
where pinned = true;

with latest_visible as (
  select id
  from public.community_feed_posts
  where hidden_at is null
  order by created_at desc, id desc
  limit 1
)
update public.community_feed_posts p
set
  pinned = true,
  caption = 'Pinned test post: this should always stay at the top of Lounge.'
from latest_visible lv
where p.id = lv.id;
