-- 메모에 체크리스트(할일) 항목 추가
-- 각 메모가 [{ id, text, done }] 형태의 체크박스 목록을 가질 수 있도록 jsonb 컬럼 추가.
-- 기존 메모는 빈 배열([])로 자동 채워지므로 안전하게 적용 가능.

alter table memos
  add column if not exists checklist jsonb not null default '[]'::jsonb;
