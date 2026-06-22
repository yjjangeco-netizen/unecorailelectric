-- AI 비서/자동화 설정 및 분석 결과 저장용 테이블
-- 현재 DB의 users.id 타입이 text이므로 assistant_* 테이블의 user_id도 text로 맞춥니다.

create extension if not exists pgcrypto;

drop table if exists assistant_expenses cascade;
drop table if exists assistant_analysis_logs cascade;
drop table if exists assistant_settings cascade;

create table if not exists assistant_settings (
  user_id text primary key references users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  google_calendar_id text,
  google_connected boolean not null default false,
  google_drive_folder_id text,
  google_tokens jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists assistant_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete set null,
  source_type text not null check (source_type in ('manual', 'sms', 'call_recording', 'conversation', 'google_calendar')),
  source_title text,
  source_uri text,
  raw_text text,
  summary text,
  decisions jsonb not null default '[]'::jsonb,
  todos jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  status text not null default 'analyzed',
  created_at timestamptz not null default now()
);

create table if not exists assistant_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete set null,
  source_message text not null,
  transaction_at timestamptz,
  merchant text,
  amount numeric(12, 2) not null,
  card_name text,
  category text,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists assistant_recordings (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete set null,
  file_name text not null,
  file_uri text,
  drive_file_id text,
  drive_web_url text,
  transcript text,
  analysis_log_id uuid references assistant_analysis_logs(id) on delete set null,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

alter table assistant_settings enable row level security;
alter table assistant_analysis_logs enable row level security;
alter table assistant_expenses enable row level security;
alter table assistant_recordings enable row level security;

drop policy if exists assistant_settings_service_policy on assistant_settings;
drop policy if exists assistant_analysis_logs_service_policy on assistant_analysis_logs;
drop policy if exists assistant_expenses_service_policy on assistant_expenses;
drop policy if exists assistant_recordings_service_policy on assistant_recordings;

create policy assistant_settings_service_policy
  on assistant_settings for all
  using (true)
  with check (true);

create policy assistant_analysis_logs_service_policy
  on assistant_analysis_logs for all
  using (true)
  with check (true);

create policy assistant_expenses_service_policy
  on assistant_expenses for all
  using (true)
  with check (true);

create policy assistant_recordings_service_policy
  on assistant_recordings for all
  using (true)
  with check (true);
