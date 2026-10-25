-- Public bucket objects remain accessible through public URLs. Restrict object listing to admins.
drop policy if exists jf_media_public_read on storage.objects;
drop policy if exists jf_media_admin_read on storage.objects;
create policy jf_media_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'jf-media' and (select public.jf_is_admin()));