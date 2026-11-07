-- Kör i Supabase SQL Editor efter granskning. Endast godkända lärare/admin får skriva.
create table if not exists public.teacher_materials (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 type text not null check (type in ('worksheet','exit','quiz','support','week')),
 title text not null default 'Utan namn',
 content jsonb not null default '{}'::jsonb,
 shared boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists teacher_materials_owner_idx on public.teacher_materials(owner_id,updated_at desc);
create index if not exists teacher_materials_shared_idx on public.teacher_materials(shared,updated_at desc);
alter table public.teacher_materials enable row level security;
drop policy if exists teacher_materials_select on public.teacher_materials;
create policy teacher_materials_select on public.teacher_materials for select to authenticated
using (
 owner_id=(select auth.uid())
 or (shared=true and exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in ('teacher','admin')))
);
drop policy if exists teacher_materials_insert on public.teacher_materials;
create policy teacher_materials_insert on public.teacher_materials for insert to authenticated
with check (
 owner_id=(select auth.uid()) and exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in ('teacher','admin'))
);
drop policy if exists teacher_materials_update on public.teacher_materials;
create policy teacher_materials_update on public.teacher_materials for update to authenticated
using(owner_id=(select auth.uid()) and exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in ('teacher','admin')))
with check(owner_id=(select auth.uid()) and exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in ('teacher','admin')));
drop policy if exists teacher_materials_delete on public.teacher_materials;
create policy teacher_materials_delete on public.teacher_materials for delete to authenticated using(owner_id=(select auth.uid()));
grant select,insert,update,delete on public.teacher_materials to authenticated;
