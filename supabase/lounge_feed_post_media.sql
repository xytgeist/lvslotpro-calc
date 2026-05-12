-- Optional image URL on feed posts + public `lounge-feed` storage (path: `{user_id}/...`).
-- Apply in Supabase after `feed_phase_a_profiles_public_read.sql`.

alter table public.community_feed_posts
  add column if not exists media_url text;

comment on column public.community_feed_posts.media_url is
  'Optional public URL for an image attached to the post (bucket lounge-feed).';

-- ---------------------------------------------------------------------------
-- Storage: lounge-feed (public read; authenticated users write only under own user_id folder)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('lounge-feed', 'lounge-feed', true)
on conflict (id) do nothing;

drop policy if exists lounge_feed_objects_select_public on storage.objects;
create policy lounge_feed_objects_select_public
on storage.objects for select
using (bucket_id = 'lounge-feed');

drop policy if exists lounge_feed_insert_own on storage.objects;
create policy lounge_feed_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lounge-feed'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists lounge_feed_update_own on storage.objects;
create policy lounge_feed_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'lounge-feed'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists lounge_feed_delete_own on storage.objects;
create policy lounge_feed_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'lounge-feed'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Image + external GIF on one post: run `lounge_feed_post_gif_url.sql` (adds `gif_url`).
