-- =============================================
-- Life Dashboard - Supabase Schema + RLS
-- הדבק את כל הקוד הזה ב-SQL Editor של Supabase
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  avatar_url text,
  week_type text check (week_type in ('A', 'B')) default 'A',
  created_at timestamptz default now()
);

-- Domains
create table public.domains (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#3B82F6',
  icon text not null default '📁',
  archived boolean default false,
  created_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Tasks
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  domain_id uuid references public.domains(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  type text check (type in ('today', 'week', 'month', 'quarter', 'year')) not null default 'today',
  priority text check (priority in ('low', 'medium', 'high')) not null default 'medium',
  status text check (status in ('not_started', 'in_progress', 'done', 'paused')) not null default 'not_started',
  deadline date,
  estimated_duration integer, -- minutes
  actual_duration integer,    -- minutes
  notes text,
  recurring boolean default false,
  recurrence_rule text,
  created_at timestamptz default now()
);

-- Time entries
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  domain_id uuid references public.domains(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz default now()
);

-- Availability slots
create table public.availability_slots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  hour integer check (hour >= 8 and hour <= 22) not null,
  status text check (status in ('free', 'busy', 'flexible', 'office')) not null,
  created_at timestamptz default now(),
  unique(user_id, date, hour)
);

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.users(id) on delete cascade not null,
  to_user_id uuid references public.users(id) on delete cascade not null,
  type text check (type in ('slot_request', 'slot_conflict')) not null,
  payload jsonb default '{}',
  status text check (status in ('pending', 'approved', 'declined', 'rescheduled')) not null default 'pending',
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.users enable row level security;
alter table public.domains enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.time_entries enable row level security;
alter table public.availability_slots enable row level security;
alter table public.notifications enable row level security;

-- Users: each user sees only their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Domains: private to each user
create policy "Users manage own domains" on public.domains
  for all using (auth.uid() = user_id);

-- Projects: private to each user
create policy "Users manage own projects" on public.projects
  for all using (auth.uid() = user_id);

-- Tasks: private to each user
create policy "Users manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Time entries: private to each user
create policy "Users manage own time entries" on public.time_entries
  for all using (auth.uid() = user_id);

-- Availability: each user can read ALL slots (shared board), but only write their own
create policy "Users can read all availability" on public.availability_slots
  for select using (true);

create policy "Users manage own availability" on public.availability_slots
  for insert with check (auth.uid() = user_id);

create policy "Users update own availability" on public.availability_slots
  for update using (auth.uid() = user_id);

create policy "Users delete own availability" on public.availability_slots
  for delete using (auth.uid() = user_id);

-- Notifications: users can see notifications sent to them or from them
create policy "Users view own notifications" on public.notifications
  for select using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy "Users create notifications" on public.notifications
  for insert with check (auth.uid() = from_user_id);

create policy "Users update notifications sent to them" on public.notifications
  for update using (auth.uid() = to_user_id);

-- =============================================
-- TRIGGER: auto-create user profile on signup
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- SEED DATA: Saar's domains and projects
-- (Run AFTER creating Saar's account)
-- Replace 'SAAR_USER_ID' with Saar's actual UUID from auth.users
-- =============================================

-- Uncomment and fill in the UUID after creating Saar's account:
/*
DO $$
DECLARE
  saar_id uuid := 'SAAR_USER_ID';
  domain_tp uuid;
  domain_rd uuid;
  domain_pad uuid;
  domain_ai uuid;
  domain_fam uuid;
BEGIN
  -- Teleperformance
  INSERT INTO domains (user_id, name, color, icon) VALUES (saar_id, 'טלפרפורמנס', '#3B82F6', '💼') RETURNING id INTO domain_tp;
  -- Ronda Digital
  INSERT INTO domains (user_id, name, color, icon) VALUES (saar_id, 'רונדה דיגיטל', '#10B981', '🚀') RETURNING id INTO domain_rd;
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_rd, 'SpaceBook');
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_rd, 'AccuPOS');
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_rd, 'Client X');
  -- Padeling
  INSERT INTO domains (user_id, name, color, icon) VALUES (saar_id, 'פאדלינג', '#F59E0B', '🎾') RETURNING id INTO domain_pad;
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_pad, 'פרויקט חיפה');
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_pad, 'בית ברל');
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_pad, 'padeling.co.il');
  -- AI/Dropshipping
  INSERT INTO domains (user_id, name, color, icon) VALUES (saar_id, 'AI / דרופשיפינג', '#8B5CF6', '🤖') RETURNING id INTO domain_ai;
  -- Personal/Family
  INSERT INTO domains (user_id, name, color, icon) VALUES (saar_id, 'אישי / משפחה', '#EC4899', '🏠') RETURNING id INTO domain_fam;
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_fam, 'כרמי');
  INSERT INTO projects (user_id, domain_id, name) VALUES (saar_id, domain_fam, 'בית');
END $$;
*/

-- Bar's domains (run after creating Bar's account):
/*
DO $$
DECLARE
  bar_id uuid := 'BAR_USER_ID';
  domain_barn uuid;
  domain_fam uuid;
BEGIN
  INSERT INTO domains (user_id, name, color, icon) VALUES (bar_id, 'Barn', '#14B8A6', '🏢') RETURNING id INTO domain_barn;
  INSERT INTO domains (user_id, name, color, icon) VALUES (bar_id, 'אישי / משפחה', '#EC4899', '🏠') RETURNING id INTO domain_fam;
  INSERT INTO projects (user_id, domain_id, name) VALUES (bar_id, domain_fam, 'כרמי');
END $$;
*/
