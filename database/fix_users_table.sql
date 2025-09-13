-- users 테이블 수정 스크립트 (테스트 계정 제거됨)

-- 1. 기존 users 테이블에 password와 level 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'level1';

-- 2. 기존 사용자들에게 기본 비밀번호 설정
UPDATE users SET password = 'password123' WHERE password IS NULL;
UPDATE users SET level = 'level1' WHERE level IS NULL;

-- 3. 테스트 계정들은 제거됨
-- 실제 운영 환경에서는 관리자가 직접 사용자 계정을 추가하세요

-- 4. 변경사항 확인
SELECT id, name, department, position, is_admin, level, password IS NOT NULL as has_password 
FROM users 
ORDER BY is_admin DESC, name;
