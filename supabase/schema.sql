-- ==============================================================================
-- JOB TRACKER - SUPABASE DATABASE SCHEMA & POLICIES
-- ==============================================================================
-- Execute this entire script in the Supabase SQL Editor (SQL -> New Query -> Run)

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- User Settings (stores per-user theme and notification preferences)
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'system',
  browser_notifications boolean default false
);

-- Resumes (metadata for uploaded PDF documents in Supabase Storage)
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  file_path text not null,
  size_bytes bigint,
  created_at timestamptz default now()
);

-- Applications (job applications across pipeline stages)
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  company_name text not null,
  role text not null,
  ctc text,
  location text,
  job_type text,
  source text,
  link text,
  applied_date date,
  stage text not null default 'saved' check (stage in ('saved','applied','assessment','interview','selected','rejected')),
  resume_id uuid references resumes(id) on delete set null,
  notes text,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stage History (records stage transitions)
create table if not exists stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  from_stage text,
  to_stage text,
  changed_at timestamptz default now()
);

-- Reminders (deadlines, follow-ups, and interviews)
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  application_id uuid references applications(id) on delete cascade,
  title text not null,
  description text,
  remind_at timestamptz not null,
  is_done boolean default false,
  notified boolean default false,
  created_at timestamptz default now()
);

-- 3. ROW LEVEL SECURITY (RLS)

alter table user_settings enable row level security;
alter table resumes enable row level security;
alter table applications enable row level security;
alter table stage_history enable row level security;
alter table reminders enable row level security;

-- Policies for user_settings
drop policy if exists "Users can select own settings" on user_settings;
create policy "Users can select own settings" on user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on user_settings;
create policy "Users can insert own settings" on user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on user_settings;
create policy "Users can update own settings" on user_settings
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own settings" on user_settings;
create policy "Users can delete own settings" on user_settings
  for delete using (auth.uid() = user_id);

-- Policies for resumes
drop policy if exists "Users can select own resumes" on resumes;
create policy "Users can select own resumes" on resumes
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own resumes" on resumes;
create policy "Users can insert own resumes" on resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own resumes" on resumes;
create policy "Users can update own resumes" on resumes
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own resumes" on resumes;
create policy "Users can delete own resumes" on resumes
  for delete using (auth.uid() = user_id);

-- Policies for applications
drop policy if exists "Users can select own applications" on applications;
create policy "Users can select own applications" on applications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own applications" on applications;
create policy "Users can insert own applications" on applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own applications" on applications;
create policy "Users can update own applications" on applications
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own applications" on applications;
create policy "Users can delete own applications" on applications
  for delete using (auth.uid() = user_id);

-- Policies for stage_history
drop policy if exists "Users can select own stage history" on stage_history;
create policy "Users can select own stage history" on stage_history
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own stage history" on stage_history;
create policy "Users can insert own stage history" on stage_history
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own stage history" on stage_history;
create policy "Users can update own stage history" on stage_history
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own stage history" on stage_history;
create policy "Users can delete own stage history" on stage_history
  for delete using (auth.uid() = user_id);

-- Policies for reminders
drop policy if exists "Users can select own reminders" on reminders;
create policy "Users can select own reminders" on reminders
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reminders" on reminders;
create policy "Users can insert own reminders" on reminders
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reminders" on reminders;
create policy "Users can update own reminders" on reminders
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own reminders" on reminders;
create policy "Users can delete own reminders" on reminders
  for delete using (auth.uid() = user_id);

-- 4. TRIGGERS & FUNCTIONS

-- Function to update 'updated_at' timestamp automatically
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_applications_updated_at on applications;
create trigger set_applications_updated_at
before update on applications
for each row
execute function handle_updated_at();

-- Function to record stage transitions in stage_history
create or replace function handle_stage_transition_history()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    insert into stage_history (application_id, user_id, from_stage, to_stage, changed_at)
    values (new.id, new.user_id, null, new.stage, now());
  elsif (TG_OP = 'UPDATE' and old.stage is distinct from new.stage) then
    insert into stage_history (application_id, user_id, from_stage, to_stage, changed_at)
    values (new.id, new.user_id, old.stage, new.stage, now());
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists track_application_stage_history on applications;
create trigger track_application_stage_history
after insert or update on applications
for each row
execute function handle_stage_transition_history();

-- 5. STORAGE BUCKET & STORAGE POLICIES
-- Create the private "resumes" bucket (PDF only, max 5MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['application/pdf'];

-- Storage bucket access policies restricting files under folder named after auth.uid()
drop policy if exists "Users can read own resume files" on storage.objects;
create policy "Users can read own resume files"
  on storage.objects for select
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own resume files" on storage.objects;
create policy "Users can upload own resume files"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own resume files" on storage.objects;
create policy "Users can update own resume files"
  on storage.objects for update
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own resume files" on storage.objects;
create policy "Users can delete own resume files"
  on storage.objects for delete
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6. REALTIME SUBSCRIPTION
-- Enable Supabase Realtime publication on applications and reminders
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'applications'
  ) then
    alter publication supabase_realtime add table applications;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'reminders'
  ) then
    alter publication supabase_realtime add table reminders;
  end if;
end $$;
