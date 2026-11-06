-- Kör i Supabase SQL Editor en gång.
create table if not exists public.classroom_boards (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'Min klassrumstavla',
 content jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists classroom_boards_owner_idx on public.classroom_boards(owner_id,updated_at desc);
alter table public.classroom_boards enable row level security;
create policy "classroom_boards_read_own" on public.classroom_boards for select to authenticated using (owner_id=(select auth.uid()));
create policy "classroom_boards_insert_own" on public.classroom_boards for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "classroom_boards_update_own" on public.classroom_boards for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "classroom_boards_delete_own" on public.classroom_boards for delete to authenticated using (owner_id=(select auth.uid()));
grant select,insert,update,delete on public.classroom_boards to authenticated;
