-- 1. users 테이블에 color 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS color text;

-- 2. users 테이블에 권한 관련 컬럼 추가 (없는 경우에만)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stock_view boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stock_in boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stock_out boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stock_disposal boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_tools boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_log boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_manual boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sop boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_management boolean DEFAULT false;

-- 3. business_trips 테이블에 필요한 컬럼들이 있는지 확인 (일반적으로 사용되는 컬럼들)
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS sub_type text;
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS category text;

-- 4. 확인용: users 테이블의 color 컬럼 업데이트 예시 (관리자용)
-- UPDATE users SET color = '#3788d8' WHERE username = 'admin';
