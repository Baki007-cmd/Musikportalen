-- Kör i Supabase > SQL Editor för Musikportalen.
create table if not exists public.music_boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Min nottavla',
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists music_boards_owner_idx on public.music_boards(owner_id,updated_at desc);
alter table public.music_boards enable row level security;
create policy "music_boards_select_own" on public.music_boards for select to authenticated using (owner_id = (select auth.uid()));
create policy "music_boards_insert_own" on public.music_boards for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "music_boards_update_own" on public.music_boards for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "music_boards_delete_own" on public.music_boards for delete to authenticated using (owner_id = (select auth.uid()));
grant select,insert,update,delete on public.music_boards to authenticated;
