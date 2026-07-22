-- Hotfix: fan-only insert guard ran before trg_set_community_feed_posts_user_id (name order),
-- so new.user_id was null and monetization lookup always failed.

create or replace function public.community_feed_posts_creator_fan_only_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid := coalesce(new.user_id, auth.uid());
begin
  if not coalesce(new.creator_fan_only, false) then
    return new;
  end if;
  if v_author_id is null then
    raise exception 'Enable fan subscriptions (Connect + go live) before posting to Subs only';
  end if;
  if not exists (
    select 1
    from public.creator_monetization_profiles cmp
    where cmp.user_id = v_author_id
      and cmp.enabled
      and cmp.connect_onboarding_complete
      and cmp.stripe_connect_account_id is not null
  ) then
    raise exception 'Enable fan subscriptions (Connect + go live) before posting to Subs only';
  end if;
  return new;
end;
$$;
