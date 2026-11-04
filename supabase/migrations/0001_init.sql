-- EstudAI: schema inicial. Todas as tabelas isoladas por usuário via RLS (mesmo padrão das outras apps).
create extension if not exists pgcrypto;

create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  area text,
  color text not null default '#2f8cff',
  total_lessons integer not null default 0 check (total_lessons >= 0),
  watched_lessons integer not null default 0 check (watched_lessons >= 0),
  weekly_goal_min integer not null default 0 check (weekly_goal_min >= 0),
  review_every_days smallint not null default 14 check (review_every_days between 1 and 365),
  last_reviewed_on date,
  priority boolean not null default false,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  subject_id uuid references subjects on delete set null,
  due_on date,
  urgent boolean not null default false,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Bloco fixo da semana (repete toda semana). weekday: 0 = segunda … 6 = domingo.
create table blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  minutes smallint not null check (minutes between 5 and 720),
  subject_id uuid references subjects on delete set null,
  title text,
  created_at timestamptz not null default now()
);

-- Cada sessão de estudo registrada (pelo cronômetro, por “concluir bloco” ou manualmente).
create table study_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid references subjects on delete set null,
  block_id uuid references blocks on delete set null,
  studied_on date not null default current_date,
  minutes integer not null check (minutes between 1 and 1440),
  note text,
  created_at timestamptz not null default now()
);
create index study_log_user_day on study_log (user_id, studied_on desc);

create table links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  url text,
  kind text not null default 'link' check (kind in ('pdf', 'livro', 'curso', 'video', 'link')),
  subject_id uuid references subjects on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- Uma linha por usuário: meta semanal total e a frase da semana escolhida por ele.
create table settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  weekly_goal_min integer not null default 600 check (weekly_goal_min >= 0),
  quote text,
  quote_week text
);

-- RLS: cada usuário só enxerga e altera as próprias linhas.
alter table subjects enable row level security;
create policy "own rows" on subjects for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table tasks enable row level security;
create policy "own rows" on tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table blocks enable row level security;
create policy "own rows" on blocks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table study_log enable row level security;
create policy "own rows" on study_log for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table links enable row level security;
create policy "own rows" on links for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table settings enable row level security;
create policy "own rows" on settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
