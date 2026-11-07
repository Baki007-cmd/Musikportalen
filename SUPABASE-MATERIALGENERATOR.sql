-- Kör en gång i Supabase SQL Editor för att kunna spara lektionsupplägg från materialgeneratorn.
alter table public.teacher_materials
drop constraint if exists teacher_materials_type_check;
alter table public.teacher_materials
add constraint teacher_materials_type_check
check (type in ('worksheet','exit','quiz','support','week','lesson'));
