-- 알림(인앱 + 푸시 공용)
-- 1) notifications: 사용자에게 도착한 알림
-- 2) notification_settings: 사용자별 알림 on/off + 유형 선택
-- 3) push_tokens: FCM 디바이스 토큰(진짜 푸시용, 2단계)

create extension if not exists pgcrypto;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  type text not null,                  -- event_created | work_report_submitted | report_approved
  title text not null,
  body text,
  link text,                           -- 탭 시 이동할 앱 경로
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, is_read, created_at desc);

alter table notifications enable row level security;
drop policy if exists notifications_all on notifications;
create policy notifications_all on notifications for all using (true) with check (true);

create table if not exists notification_settings (
  user_id text primary key references users(id) on delete cascade,
  enabled boolean not null default true,          -- 전체 on/off
  event_created boolean not null default true,    -- 일정 등록
  work_report_submitted boolean not null default true,  -- 업무보고 올라옴
  report_approved boolean not null default true,  -- 업무/출장 보고 승인
  updated_at timestamptz not null default now()
);

alter table notification_settings enable row level security;
drop policy if exists notification_settings_all on notification_settings;
create policy notification_settings_all on notification_settings for all using (true) with check (true);

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  token text not null unique,
  platform text default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_push_tokens_user on push_tokens(user_id);

alter table push_tokens enable row level security;
drop policy if exists push_tokens_all on push_tokens;
create policy push_tokens_all on push_tokens for all using (true) with check (true);
