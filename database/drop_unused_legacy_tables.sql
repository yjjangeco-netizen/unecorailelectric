-- ============================================================
-- 미사용 레거시 테이블 삭제
-- ============================================================
-- 대상: local_events, project_events
--  - 코드(.from/조인/임베디드 select)·마이그레이션·트리거 어디에도 참조 없음
--  - 다른 테이블이 이들을 FK로 참조하지 않음 (삭제 시 의존성 깨짐 없음)
--  - 현재 캘린더는 events 테이블을 사용 → local_events/project_events 는 구버전
--
-- ⚠️ 주의: DROP TABLE 은 데이터까지 영구 삭제되며 되돌릴 수 없습니다.
--    실행 전 아래 1) 행 수 확인을 먼저 돌려 보관할 데이터가 없는지 검증하세요.
--    필요하면 Supabase 대시보드에서 백업(또는 CSV export) 후 진행하세요.
-- ============================================================

-- 1) (먼저 실행) 보관할 데이터가 남아있는지 확인 -----------------
--    결과가 0 이면 안심하고 아래 2) 삭제를 진행하세요.
-- SELECT 'local_events'  AS table, count(*) FROM public.local_events
-- UNION ALL
-- SELECT 'project_events' AS table, count(*) FROM public.project_events;

-- 2) (확인 후 실행) 삭제 ----------------------------------------
DROP TABLE IF EXISTS public.local_events;
DROP TABLE IF EXISTS public.project_events;

-- 참고: machine_* 11개 테이블은 진행 중인 챗봇/알람 기능 소속이라
--       현재 코드 참조가 없어도 삭제하지 않습니다.
