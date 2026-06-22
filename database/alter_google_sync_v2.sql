-- Google 동기화 v2 마이그레이션
-- assistant_google_event_links 테이블에 분류 및 상태 정보 컬럼 추가
-- Supabase SQL Editor에서 실행 후 코드를 배포하세요

ALTER TABLE assistant_google_event_links
  ADD COLUMN IF NOT EXISTS local_table TEXT DEFAULT 'events',
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced',
  ADD COLUMN IF NOT EXISTS google_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_summary TEXT,
  ADD COLUMN IF NOT EXISTS google_description TEXT;

-- 기존 DB의 개인일정 데이터 삭제 (사용자 요청 사항: "기존 DB에 쌓인 개인일정이 없을건데. 있으면 삭제해")
DELETE FROM events WHERE category = '개인일정';
