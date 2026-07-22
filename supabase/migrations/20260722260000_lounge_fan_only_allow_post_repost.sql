-- Allow repost / quote repost of fan-only posts; keep blocking comment-repost on fan-only parents.

begin;

create or replace function public.community_feed_posts_block_fan_only_repost()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fan_only boolean := false;
begin
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

comment on function public.community_feed_posts_block_fan_only_repost() is
  'Blocks comment-repost when parent post is creator_fan_only; post repost/quote allowed.';

commit;
