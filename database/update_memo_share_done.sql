-- 메모: 공개 범위 + 완료(할일) 체크 + 체크리스트 컬럼 정리
--   share_level : 0=비공개(본인만), 1~5=해당 레벨 이상 공개, 99=관리자만
--   done        : 메모 앞 체크박스(할일 완료 여부)
-- 기존에 추가했던 checklist(jsonb)는 사용하지 않으므로 제거.

alter table memos add column if not exists share_level int not null default 0;
alter table memos add column if not exists done boolean not null default false;
alter table memos drop column if exists checklist;

-- 공유 메모 조회 성능용 인덱스
create index if not exists memos_share_idx on memos(share_level) where share_level > 0;
