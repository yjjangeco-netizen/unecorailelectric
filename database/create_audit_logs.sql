-- 감사 로그 (src/lib/audit.ts 의 AuditLogEntry 구조에 맞춤)
-- 라이브 DB에 audit_logs 테이블이 없어 입고/폐기/마감 감사 기록과
-- AuditLogModal 조회가 모두 조용히 실패하고 있었음 → 테이블 생성.

create extension if not exists pgcrypto;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  user_id text,
  username text,
  user_role text,
  ip_address text,
  user_agent text,
  category text not null,
  action text not null,
  level text not null default 'info',
  resource_type text,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  session_id text,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_timestamp on audit_logs(timestamp desc);
create index if not exists idx_audit_logs_category on audit_logs(category);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_level on audit_logs(level);

comment on table audit_logs is '시스템 감사 로그 (인증/권한/재고/시스템 작업 기록)';

-- 다른 테이블과 동일하게 RLS + permissive policy (서버 라우트가 anon 키로 접근)
alter table audit_logs enable row level security;

drop policy if exists audit_logs_select on audit_logs;
drop policy if exists audit_logs_insert on audit_logs;

create policy audit_logs_select on audit_logs for select using (true);
create policy audit_logs_insert on audit_logs for insert with check (true);
