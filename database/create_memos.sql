-- Windows Sticky Notes 스타일 개인 메모장
-- 현재 DB의 users.id 타입이 text이므로 user_id도 text로 맞춥니다.

create extension if not exists pgcrypto;

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

create policy memos_service_policy
  on memos for all
  using (true)
  with check (true);
