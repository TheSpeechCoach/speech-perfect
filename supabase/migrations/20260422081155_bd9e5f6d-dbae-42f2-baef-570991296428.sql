
-- USER GOALS (new table)
create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  goal_title text not null,
  goal_description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.user_goals enable row level security;

create policy "own goals read" on public.user_goals
  for select using (auth.uid() = user_id);
create policy "own goals insert" on public.user_goals
  for insert with check (auth.uid() = user_id);
create policy "own goals update" on public.user_goals
  for update using (auth.uid() = user_id);
create policy "own goals delete" on public.user_goals
  for delete using (auth.uid() = user_id);

create index if not exists idx_user_goals_user on public.user_goals(user_id);

-- SESSION SCORES: add pause_count
alter table public.session_scores
  add column if not exists pause_count integer not null default 0;

-- SUBSCRIPTIONS: add stripe ids + primary key
alter table public.subscriptions
  add column if not exists id uuid not null default gen_random_uuid(),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_pkey'
  ) then
    alter table public.subscriptions add constraint subscriptions_pkey primary key (id);
  end if;
end $$;

create unique index if not exists subscriptions_user_id_key on public.subscriptions(user_id);

-- SESSIONS: add status + session_date
alter table public.sessions
  add column if not exists status text not null default 'completed',
  add column if not exists session_date date not null default current_date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sessions_status_check'
  ) then
    alter table public.sessions
      add constraint sessions_status_check check (status in ('draft','completed','failed'));
  end if;
end $$;

-- USER PROGRAMMES: add status + completed_at
alter table public.user_programmes
  add column if not exists status text not null default 'active',
  add column if not exists completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_programmes_status_check'
  ) then
    alter table public.user_programmes
      add constraint user_programmes_status_check check (status in ('active','completed','paused'));
  end if;
end $$;

-- SESSION EXERCISES: add display_order
alter table public.session_exercises
  add column if not exists display_order integer not null default 1;
