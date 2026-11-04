-- Cronograma com datas (ex.: preparação para um concurso): cada sessão tem dia, horário, matéria e conteúdo.
create table plan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid references subjects on delete set null,
  planned_on date not null,
  start_time time not null,
  minutes smallint not null check (minutes between 5 and 720),
  topic text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index plan_sessions_user_day on plan_sessions (user_id, planned_on);

alter table plan_sessions enable row level security;
create policy "own rows" on plan_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Registro de estudo pode apontar para a sessão do cronograma que foi concluída.
alter table study_log add column plan_session_id uuid references plan_sessions on delete set null;

-- Prova-alvo: alimenta a contagem regressiva.
alter table settings add column exam_name text;
alter table settings add column exam_date date;
