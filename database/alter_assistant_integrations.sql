-- AI 비서 추가 연동 마이그레이션
-- 기존 assistant 데이터는 유지하고 필요한 제약/테이블만 추가합니다.

alter table if exists assistant_analysis_logs
  drop constraint if exists assistant_analysis_logs_source_type_check;

alter table if exists assistant_analysis_logs
  add constraint assistant_analysis_logs_source_type_check
  check (source_type in (
    'manual',
    'sms',
    'call_recording',
    'conversation',
    'telegram',
    'google_calendar',
    'google_drive'
  ));

create table if not exists assistant_google_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  local_event_id text not null,
  google_event_id text not null,
  google_html_link text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, local_event_id),
  unique (user_id, google_event_id)
);

alter table assistant_google_event_links enable row level security;

drop policy if exists assistant_google_event_links_service_policy on assistant_google_event_links;

create policy assistant_google_event_links_service_policy
  on assistant_google_event_links for all
  using (true)
  with check (true);
