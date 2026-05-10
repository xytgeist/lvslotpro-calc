-- Run in Supabase SQL editor after `feed_phase_a_profiles_public_read.sql`
-- (and after `feed_pin_insert_guard_and_single_pin_trigger.sql` if you already ran it).
--
-- Replaces "at most one pinned post" with "at most two pinned visible posts".
-- Drops the partial unique index that caused duplicate-key errors on a second pin.

drop index if exists public.community_feed_single_pinned_idx;

drop trigger if exists trg_community_feed_posts_single_pin on public.community_feed_posts;
drop function if exists public.community_feed_posts_single_pin_enforcer();

create or replace function public.community_feed_posts_enforce_max_two_pins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pinned_other int;
  becoming_pinned boolean;
begin
  becoming_pinned := coalesce(new.pinned, false) is true
    and new.hidden_at is null
    and (
      tg_op = 'INSERT'
      or (tg_op = 'UPDATE' and coalesce(old.pinned, false) is not true)
    );

  if not becoming_pinned then
    return new;
  end if;

  select count(*)::int
  into pinned_other
  from public.community_feed_posts c
  where coalesce(c.pinned, false) is true
    and c.hidden_at is null
    and c.id is distinct from new.id;

  if pinned_other >= 2 then
    raise exception 'MAX_PINNED_POSTS';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_community_feed_posts_max_two_pins on public.community_feed_posts;
create trigger trg_community_feed_posts_max_two_pins
  before insert or update on public.community_feed_posts
  for each row
  execute function public.community_feed_posts_enforce_max_two_pins();

comment on column public.community_feed_posts.pinned is 'Staff: at most two visible pinned posts (see trg_community_feed_posts_max_two_pins).';
