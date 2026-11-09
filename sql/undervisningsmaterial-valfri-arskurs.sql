-- Kör en gång i Supabase SQL Editor för att göra årskurs valfri.
-- Befintliga material och årskurser påverkas inte.
alter table public.teaching_materials alter column grade drop not null;
