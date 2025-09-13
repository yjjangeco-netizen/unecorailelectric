-- ========================================
-- 프로젝트 테이블에 location 컬럼 추가 및 데이터 설정
-- ========================================

-- 1. location 컬럼 추가 (이미 있으면 무시)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- 2. 기존 데이터에 location 값 설정
UPDATE projects SET location = 'A동 전기실' WHERE name = '전기설비 유지보수';
UPDATE projects SET location = 'B동 신축건물' WHERE name = '신규 설치';
UPDATE projects SET location = 'C동 조명실' WHERE name = '고장 수리';
UPDATE projects SET location = 'D동 배전반' WHERE name = '점검 작업';
UPDATE projects SET location = 'E동 기계실' WHERE name = '기타 업무';

-- 3. location이 null인 경우 기본값 설정
UPDATE projects SET location = '미지정' WHERE location IS NULL;

-- 4. 확인용 쿼리
SELECT id, name, location, is_active, created_at FROM projects ORDER BY id;
