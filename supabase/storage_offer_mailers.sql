-- Private bucket for mailer / email screenshots (run once in Supabase SQL editor)
-- After creating bucket, users upload via client: storage.from('offer-mailers').upload(...)

insert into storage.buckets (id, name, public)
values ('offer-mailers', 'offer-mailers', false)
on conflict (id) do nothing;

-- Authenticated users can upload/read/update/delete only under their own folder: {uid}/...
drop policy if exists "offer_mailers_insert_own" on storage.objects;
create policy "offer_mailers_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'offer-mailers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "offer_mailers_select_own" on storage.objects;
create policy "offer_mailers_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'offer-mailers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "offer_mailers_update_own" on storage.objects;
create policy "offer_mailers_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'offer-mailers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "offer_mailers_delete_own" on storage.objects;
create policy "offer_mailers_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'offer-mailers'
  and (storage.foldername(name))[1] = auth.uid()::text
);
