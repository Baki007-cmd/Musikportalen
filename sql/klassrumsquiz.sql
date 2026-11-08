-- Kör hela skriptet en gång i Supabase SQL Editor.
-- Klassrumsquiz: inga elevkonton krävs; slumpade deltagartoken i webbläsaren.
create extension if not exists pgcrypto;
create table if not exists public.classroom_quizzes (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null, subject text not null, grade int not null check(grade between 1 and 9),
 questions jsonb not null, pin text not null unique, position int not null default -1,
 status text not null default 'lobby' check(status in ('lobby','playing','finished')),
 created_at timestamptz not null default now()
);
create table if not exists public.classroom_quiz_players (
 id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.classroom_quizzes(id) on delete cascade,
 token uuid not null unique, nickname text not null, joined_at timestamptz not null default now(),
 unique(quiz_id,nickname)
);
create table if not exists public.classroom_quiz_answers (
 quiz_id uuid not null references public.classroom_quizzes(id) on delete cascade,
 player_id uuid not null references public.classroom_quiz_players(id) on delete cascade,
 position int not null, choice int not null check(choice between 0 and 3),
 created_at timestamptz not null default now(), primary key(quiz_id,player_id,position)
);
alter table public.classroom_quizzes enable row level security;
alter table public.classroom_quiz_players enable row level security;
alter table public.classroom_quiz_answers enable row level security;
revoke all on public.classroom_quizzes,public.classroom_quiz_players,public.classroom_quiz_answers from anon,authenticated;
create or replace function public.classroom_quiz_action(p_action text,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.classroom_quizzes%rowtype; pl public.classroom_quiz_players%rowtype;
v_pin text; v_questions jsonb; v_question jsonb; v_position int; v_choice int;
v_rows jsonb; v_token uuid; v_nick text; v_score int; v_total int;
begin
 if p_action='create' then
  if auth.uid() is null or not exists(select 1 from public.portal_users where id=auth.uid() and role in ('teacher','admin')) then raise exception 'Lärarbehörighet krävs'; end if;
  v_questions=p_data->'questions';
  if jsonb_typeof(v_questions)<>'array' or jsonb_array_length(v_questions)<1 or jsonb_array_length(v_questions)>30 then raise exception 'Ange 1–30 frågor'; end if;
  if exists(select 1 from jsonb_array_elements(v_questions) x where jsonb_typeof(x->'answers')<>'array' or jsonb_array_length(x->'answers')<>4 or (x->>'correct')::int not between 0 and 3 or length(trim(x->>'text'))<3) then raise exception 'Kontrollera frågorna'; end if;
  for v_position in 1..20 loop
   v_pin=lpad((floor(random()*1000000))::int::text,6,'0');
   exit when not exists(select 1 from public.classroom_quizzes where pin=v_pin);
  end loop;
  insert into public.classroom_quizzes(owner_id,title,subject,grade,questions,pin)
  values(auth.uid(),left(p_data->>'title',120),left(p_data->>'subject',80),(p_data->>'grade')::int,v_questions,v_pin) returning * into q;
  return jsonb_build_object('pin',q.pin,'id',q.id);
 elsif p_action in ('host','advance','finish') then
  select * into q from public.classroom_quizzes where id=(p_data->>'id')::uuid and owner_id=auth.uid();
  if not found then raise exception 'Spelet hittades inte eller saknar behörighet'; end if;
  if p_action='advance' and q.status<>'finished' then
   update public.classroom_quizzes set position=least(position+1,jsonb_array_length(questions)-1),status='playing' where id=q.id returning * into q;
  elsif p_action='finish' then
   update public.classroom_quizzes set status='finished' where id=q.id returning * into q;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('nickname',p.nickname,'score',(
   select count(*) from public.classroom_quiz_answers a
   where a.player_id=p.id and a.choice=(q.questions->a.position->>'correct')::int
  ),'answers',(select coalesce(jsonb_agg(jsonb_build_object('position',a.position,'choice',a.choice)),'[]'::jsonb) from public.classroom_quiz_answers a where a.player_id=p.id)) order by p.joined_at),'[]'::jsonb)
  into v_rows from public.classroom_quiz_players p where p.quiz_id=q.id;
  return jsonb_build_object('pin',q.pin,'title',q.title,'position',q.position,'status',q.status,'questions',q.questions,'players',v_rows);
 elsif p_action='join' then
  v_pin=p_data->>'pin';v_nick=trim(p_data->>'nickname');
  if v_pin !~ '^[0-9]{6}$' or length(v_nick)<2 or length(v_nick)>24 then raise exception 'Kontrollera spelkod och smeknamn'; end if;
  select * into q from public.classroom_quizzes where pin=v_pin and status='lobby' and created_at>now()-interval '1 day';
  if not found then raise exception 'Ingen öppen spellobby med den koden'; end if;
  v_token=gen_random_uuid();
  insert into public.classroom_quiz_players(quiz_id,token,nickname) values(q.id,v_token,v_nick) returning * into pl;
  return jsonb_build_object('token',v_token,'nickname',pl.nickname);
 elsif p_action in ('student','answer') then
  v_token=(p_data->>'token')::uuid;
  select * into pl from public.classroom_quiz_players where token=v_token;
  if not found then raise exception 'Deltagaren hittades inte'; end if;
  select * into q from public.classroom_quizzes where id=pl.quiz_id;
  if p_action='answer' then
   if q.status<>'playing' or q.position<0 then raise exception 'Ingen aktiv fråga'; end if;
   v_choice=(p_data->>'choice')::int;
   if v_choice not between 0 and 3 then raise exception 'Ogiltigt svar'; end if;
   insert into public.classroom_quiz_answers(quiz_id,player_id,position,choice) values(q.id,pl.id,q.position,v_choice)
   on conflict do nothing;
  end if;
  select count(*) into v_score from public.classroom_quiz_answers a
  where a.player_id=pl.id and a.choice=(q.questions->a.position->>'correct')::int;
  v_question=case when q.position>=0 then q.questions->q.position else null end;
  if v_question is not null then v_question=jsonb_build_object('text',v_question->>'text','answers',v_question->'answers'); end if;
  return jsonb_build_object('status',q.status,'position',q.position,'question',v_question,'score',v_score,
    'answered',exists(select 1 from public.classroom_quiz_answers where player_id=pl.id and position=q.position),'nickname',pl.nickname);
 end if;
 raise exception 'Okänd åtgärd';
end $$;
revoke all on function public.classroom_quiz_action(text,jsonb) from public;
grant execute on function public.classroom_quiz_action(text,jsonb) to anon,authenticated;
-- Kör detta skript innan klassrumsquiz.html används.
