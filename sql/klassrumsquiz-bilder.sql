-- Kör i Supabase SQL Editor för att aktivera bilduppladdning i Klassrumsquiz.
-- Bilder är publikt läsbara för att elever ska kunna se dem utan inloggning.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('classroom-quiz-images','classroom-quiz-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "quiz_images_teacher_upload" on storage.objects;
create policy "quiz_images_teacher_upload" on storage.objects
for insert to authenticated
with check (
 bucket_id='classroom-quiz-images'
 and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.portal_users where id=auth.uid() and role in ('teacher','admin'))
);

drop policy if exists "quiz_images_teacher_delete" on storage.objects;
create policy "quiz_images_teacher_delete" on storage.objects
for delete to authenticated
using (
 bucket_id='classroom-quiz-images'
 and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.portal_users where id=auth.uid() and role in ('teacher','admin'))
);
