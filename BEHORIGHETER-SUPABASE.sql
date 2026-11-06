-- Kör i Supabase SQL Editor. Ersätt DIN_EPOST i sista steget med din egen kontoadress.
create table if not exists public.portal_users (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 role text not null default 'pending' check (role in ('pending','teacher','student','admin')),
 created_at timestamptz not null default now()
);
create or replace function public.portal_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.portal_users where id=(select auth.uid()) and role='admin') $$;
revoke all on function public.portal_is_admin() from public;
grant execute on function public.portal_is_admin() to authenticated;
create or replace function public.portal_user_created()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
 insert into public.portal_users(id,email,role)
 values(new.id,coalesce(new.email,''),'pending')
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists portal_user_created on auth.users;
create trigger portal_user_created after insert on auth.users
for each row execute function public.portal_user_created();
insert into public.portal_users(id,email,role)
select id,coalesce(email,''),'pending' from auth.users
on conflict(id) do nothing;
alter table public.portal_users enable row level security;
drop policy if exists portal_users_read on public.portal_users;
create policy portal_users_read on public.portal_users for select to authenticated
using (id=(select auth.uid()) or (select public.portal_is_admin()));
drop policy if exists portal_users_admin_update on public.portal_users;
create policy portal_users_admin_update on public.portal_users for update to authenticated
using ((select public.portal_is_admin()) and id<>(select auth.uid()))
with check ((select public.portal_is_admin()) and id<>(select auth.uid()));
revoke all on public.portal_users from anon,authenticated;
grant select on public.portal_users to authenticated;
grant update(role) on public.portal_users to authenticated;
-- Lägg till restriktiva regler ovanpå befintliga ägarpolicyer.
do $$ begin
 if to_regclass('public.classroom_boards') is not null then
  execute 'drop policy if exists classroom_boards_approved on public.classroom_boards';
  execute 'create policy classroom_boards_approved on public.classroom_boards as restrictive for all to authenticated using (exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in (''teacher'',''admin''))) with check (exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in (''teacher'',''admin'')))';
 end if;
 if to_regclass('public.lesson_plans') is not null then
  execute 'drop policy if exists lesson_plans_approved on public.lesson_plans';
  execute 'create policy lesson_plans_approved on public.lesson_plans as restrictive for all to authenticated using (exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in (''teacher'',''admin''))) with check (exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in (''teacher'',''admin'')))';
 end if;
end $$;
-- Gäller endast bucket undervisningsmaterial. Övriga buckets påverkas inte.
drop policy if exists portal_teacher_storage on storage.objects;
create policy portal_teacher_storage on storage.objects as restrictive for all to authenticated
using (bucket_id <> 'undervisningsmaterial' or exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in ('teacher','admin')))
with check (bucket_id <> 'undervisningsmaterial' or exists(select 1 from public.portal_users p where p.id=(select auth.uid()) and p.role in ('teacher','admin')));
-- AKTIVERA ADMINISTRATÖREN MANUELLT: byt DIN_EPOST mot adressen du använder för ditt konto.
-- Kör följande rad separat när du har kontrollerat adressen:
-- update public.portal_users set role='admin' where email='DIN_EPOST';
