-- Kör i Supabase SQL Editor som projektägare.
create table if not exists public.teaching_materials (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 180),
 subject text not null,
 grade smallint not null check (grade between 1 and 9),
 topic text not null,
 taught_on date,
 description text not null default '',
 reflection text not null default '',
 file_path text,
 file_name text,
 mime_type text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint file_path_owner check (file_path is null or split_part(file_path,'/',1)=owner_id::text)
);
create index if not exists teaching_materials_owner_idx on public.teaching_materials(owner_id,created_at desc);
alter table public.teaching_materials enable row level security;
drop policy if exists teaching_materials_select on public.teaching_materials;
drop policy if exists teaching_materials_insert on public.teaching_materials;
drop policy if exists teaching_materials_update on public.teaching_materials;
drop policy if exists teaching_materials_delete on public.teaching_materials;
create policy teaching_materials_select on public.teaching_materials for select to authenticated using (owner_id=auth.uid());
create policy teaching_materials_insert on public.teaching_materials for insert to authenticated with check (owner_id=auth.uid());
create policy teaching_materials_update on public.teaching_materials for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy teaching_materials_delete on public.teaching_materials for delete to authenticated using (owner_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('teaching-materials-private','teaching-materials-private',false,15728640,
array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists teaching_material_files_read on storage.objects;
drop policy if exists teaching_material_files_insert on storage.objects;
drop policy if exists teaching_material_files_delete on storage.objects;
create policy teaching_material_files_read on storage.objects for select to authenticated
 using (bucket_id='teaching-materials-private' and (storage.foldername(name))[1]=auth.uid()::text);
create policy teaching_material_files_insert on storage.objects for insert to authenticated
 with check (bucket_id='teaching-materials-private' and (storage.foldername(name))[1]=auth.uid()::text);
create policy teaching_material_files_delete on storage.objects for delete to authenticated
 using (bucket_id='teaching-materials-private' and (storage.foldername(name))[1]=auth.uid()::text);
