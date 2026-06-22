-- ============================================================
--  유네코레일 — 보류 중인 DB 작업 한 번에 실행
--  Supabase SQL Editor 에 그대로 붙여넣고 실행하세요.
--  전부 멱등(idempotent)하며, 기존 테이블/데이터는 건드리지 않습니다.
--  (라이브 스키마에 '없는' 테이블만 생성 + 미사용 테이블만 안전 삭제)
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. audit_logs  (감사 로그 — src/lib/audit.ts)
-- ============================================================
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

alter table audit_logs enable row level security;
drop policy if exists audit_logs_select on audit_logs;
drop policy if exists audit_logs_insert on audit_logs;
create policy audit_logs_select on audit_logs for select using (true);
create policy audit_logs_insert on audit_logs for insert with check (true);

-- ============================================================
-- 2. closing_history  (재고 마감 이력 — src/app/api/stock/closing-process)
--    items.id 가 uuid 이므로 item_id 도 uuid.
-- ============================================================
create table if not exists closing_history (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null,
  item_id uuid not null,
  product text not null,
  spec text,
  maker text,
  location text,
  closing_quantity integer default 0,
  unit_price numeric(15,2) default 0,
  total_amount numeric(18,2) default 0,
  closed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_closing_history_date on closing_history(closing_date);
create index if not exists idx_closing_history_item on closing_history(item_id);

alter table closing_history enable row level security;
drop policy if exists closing_history_select on closing_history;
drop policy if exists closing_history_insert on closing_history;
drop policy if exists closing_history_update on closing_history;
create policy closing_history_select on closing_history for select using (true);
create policy closing_history_insert on closing_history for insert with check (true);
create policy closing_history_update on closing_history for update using (true) with check (true);

-- ============================================================
-- 3. memos  (개인 메모장 — src/app/memo, src/app/api/memos)
-- ============================================================
create table if not exists memos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  color text not null default 'yellow',
  is_pinned boolean not null default false,
  archived boolean not null default false,
  position_x integer not null default 0,
  position_y integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memos_user_updated_idx on memos(user_id, archived, is_pinned desc, updated_at desc);

alter table memos enable row level security;
drop policy if exists memos_service_policy on memos;
create policy memos_service_policy on memos for all using (true) with check (true);

-- ============================================================
-- 4. assistant_recordings  (통화/녹음 분석 — src/app/api/assistant/recordings)
--    ⚠️ create_assistant_automation.sql 은 기존 assistant_* 를 drop 하므로
--       절대 통째로 실행하지 말 것. 여기서는 '없는' 이 테이블만 생성한다.
--    (FK 대상 assistant_analysis_logs 는 이미 라이브 DB에 존재)
-- ============================================================
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

alter table assistant_recordings enable row level security;
drop policy if exists assistant_recordings_service_policy on assistant_recordings;
create policy assistant_recordings_service_policy on assistant_recordings for all using (true) with check (true);

-- ============================================================
-- 5. 미사용 레거시 테이블 삭제 (local_events, project_events)
--    코드/마이그레이션/FK 어디에도 참조 없음. 현재 캘린더는 events 사용.
--    안전장치: 데이터가 있으면 삭제하지 않고 NOTICE 만 출력한다.
--    (정말 비우고 지우려면 NOTICE 확인 후 수동으로 DROP)
-- ============================================================
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array['local_events', 'project_events'] loop
    if to_regclass('public.' || t) is null then
      raise notice '% : 이미 없음(건너뜀)', t;
      continue;
    end if;
    execute format('select count(*) from public.%I', t) into n;
    if n = 0 then
      execute format('drop table public.%I', t);
      raise notice '% : 빈 테이블 → 삭제 완료', t;
    else
      raise notice '% : 데이터 %건 존재 → 삭제 보류(백업 후 수동 DROP 하세요)', t, n;
    end if;
  end loop;
end $$;

-- ============================================================
-- 완료. 결과 NOTICE 를 확인하세요.
-- ============================================================
