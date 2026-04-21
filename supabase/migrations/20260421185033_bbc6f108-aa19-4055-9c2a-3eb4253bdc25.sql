
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text,
  goal text,
  confidence_level int,
  scenarios text[],
  current_programme_id uuid,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete using (auth.uid() = id);

-- PROGRAMMES (public catalog)
create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  weeks int not null,
  daily_sessions int not null,
  target_outcomes text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.programmes enable row level security;
create policy "programmes readable by authenticated" on public.programmes for select to authenticated using (true);

-- USER PROGRAMMES
create table public.user_programmes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_sessions int not null default 0,
  active boolean not null default true
);
alter table public.user_programmes enable row level security;
create policy "own up read" on public.user_programmes for select using (auth.uid() = user_id);
create policy "own up insert" on public.user_programmes for insert with check (auth.uid() = user_id);
create policy "own up update" on public.user_programmes for update using (auth.uid() = user_id);
create policy "own up delete" on public.user_programmes for delete using (auth.uid() = user_id);

-- SESSIONS
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds int not null default 0
);
alter table public.sessions enable row level security;
create policy "own sessions read" on public.sessions for select using (auth.uid() = user_id);
create policy "own sessions insert" on public.sessions for insert with check (auth.uid() = user_id);
create policy "own sessions update" on public.sessions for update using (auth.uid() = user_id);
create policy "own sessions delete" on public.sessions for delete using (auth.uid() = user_id);

-- SESSION EXERCISES
create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_type text not null,
  prompt text,
  transcript text,
  audio_path text,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.session_exercises enable row level security;
create policy "own ex read" on public.session_exercises for select using (auth.uid() = user_id);
create policy "own ex insert" on public.session_exercises for insert with check (auth.uid() = user_id);
create policy "own ex update" on public.session_exercises for update using (auth.uid() = user_id);
create policy "own ex delete" on public.session_exercises for delete using (auth.uid() = user_id);

-- SESSION SCORES
create table public.session_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overall int not null,
  clarity int not null,
  pace int not null,
  filler int not null,
  structure int not null,
  wpm int not null default 0,
  filler_count int not null default 0,
  avg_sentence_length numeric not null default 0,
  feedback jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.session_scores enable row level security;
create policy "own scores read" on public.session_scores for select using (auth.uid() = user_id);
create policy "own scores insert" on public.session_scores for insert with check (auth.uid() = user_id);
create policy "own scores update" on public.session_scores for update using (auth.uid() = user_id);
create policy "own scores delete" on public.session_scores for delete using (auth.uid() = user_id);

-- STREAKS
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_session_date date,
  updated_at timestamptz not null default now()
);
alter table public.streaks enable row level security;
create policy "own streak read" on public.streaks for select using (auth.uid() = user_id);
create policy "own streak insert" on public.streaks for insert with check (auth.uid() = user_id);
create policy "own streak update" on public.streaks for update using (auth.uid() = user_id);

-- SUBSCRIPTIONS
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "own sub read" on public.subscriptions for select using (auth.uid() = user_id);
create policy "own sub update" on public.subscriptions for update using (auth.uid() = user_id);
create policy "own sub insert" on public.subscriptions for insert with check (auth.uid() = user_id);

-- AUTO-CREATE profile/streak/sub on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  insert into public.streaks (user_id) values (new.id);
  insert into public.subscriptions (user_id, tier, status) values (new.id, 'free', 'active');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- STORAGE bucket for recordings (private)
insert into storage.buckets (id, name, public) values ('recordings','recordings', false);

create policy "recordings own read" on storage.objects for select
  using (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "recordings own insert" on storage.objects for insert
  with check (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "recordings own delete" on storage.objects for delete
  using (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);

-- SEED programmes
insert into public.programmes (slug, title, description, weeks, daily_sessions, target_outcomes, sort_order) values
('stop-sounding-confused','Stop Sounding Confused','Eliminate filler words, rambling, and unclear sentence structure. Build a baseline of clean, intentional speech.',4,1,
 array['Cut filler words by 70%','Sentence length under 18 words','Clear opening and landing'],1),
('speak-with-authority','Speak With Authority','Develop the pacing, pauses, and tonal weight that signal credibility in meetings, pitches, and interviews.',6,1,
 array['Pace 130–155 WPM','Strategic pauses','Stronger sentence endings'],2),
('think-faster-speak-cleaner','Think Faster, Speak Cleaner','Train rapid response under pressure: structured answers in under 30 seconds with no filler.',6,1,
 array['Sub-3s response start','One idea per sentence','Zero filler tolerance'],3),
('high-stakes-delivery','High-Stakes Delivery','Prepare for board updates, keynotes, and investor pitches. Long-form structure, vocal control, landing key points.',8,1,
 array['Structured 3-act delivery','Memorable closing line','Sustained vocal energy'],4);
