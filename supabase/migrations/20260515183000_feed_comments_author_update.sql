-- Authors may edit their own comment body (+ edited_at). Guard identity columns so threading/post ownership cannot change via UPDATE.

drop policy if exists feed_comments_update_own on public.feed_comments;
create policy feed_comments_update_own on public.feed_comments
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant update on public.feed_comments to authenticated;

create or replace function public.feed_comments_guard_identity_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.post_id is distinct from old.post_id
     or new.user_id is distinct from old.user_id
     or new.parent_id is distinct from old.parent_id
     or new.created_at is distinct from old.created_at
  then
    raise exception 'feed_comments: cannot change post_id, user_id, parent_id, or created_at';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_comments_identity_guard on public.feed_comments;
create trigger trg_feed_comments_identity_guard
  before update on public.feed_comments
  for each row
  execute function public.feed_comments_guard_identity_fields();
