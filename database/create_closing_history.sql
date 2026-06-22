-- 재고 마감 이력 (src/app/api/stock/closing-process/route.ts 가 기록)
-- 라이브 DB에 closing_history 가 없어 마감 처리 시 이력 저장이 실패하고 있었음.
-- 주의: items.id 는 uuid 이므로 item_id 도 uuid 로 둔다.
--       (라우트 인라인 createTableSQL 의 INTEGER 선언은 오타였음)

create extension if not exists pgcrypto;

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

comment on table closing_history is '재고 월/기간 마감 시점 스냅샷 이력';

alter table closing_history enable row level security;

drop policy if exists closing_history_select on closing_history;
drop policy if exists closing_history_insert on closing_history;
drop policy if exists closing_history_update on closing_history;

create policy closing_history_select on closing_history for select using (true);
create policy closing_history_insert on closing_history for insert with check (true);
create policy closing_history_update on closing_history for update using (true) with check (true);
