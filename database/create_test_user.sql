-- ========================================
-- 테스트용 사용자 계정 생성 스크립트
-- 개발/테스트 환경용
-- ========================================

-- 1. 테스트 사용자 계정 추가
INSERT INTO users (
    id, 
    username, 
    password, 
    name, 
    department, 
    position, 
    email, 
    level, 
    is_active,
    stock_view,
    stock_in,
    stock_out,
    stock_disposal,
    work_tools,
    daily_log,
    work_manual,
    sop,
    user_management
) VALUES 
-- 관리자 계정
('admin', 'admin', 'admin123', '관리자', '전기팀', '부장', 'admin@test.com', 'administrator', true, true, true, true, true, true, true, true, true, true),

-- 일반 사용자 계정
('user1', 'user1', 'user123', '사용자1', '전기팀', '사원', 'user1@test.com', '2', true, true, false, false, false, false, false, false, false, false);

-- 2. 추가된 계정 확인
SELECT '=== 테스트 계정 추가 완료 ===' as info;
SELECT 
    id,
    username,
    name,
    department,
    position,
    level,
    is_active
FROM users 
WHERE id IN ('admin', 'user1')
ORDER BY level DESC;

-- 3. 로그인 테스트 안내
SELECT '테스트 계정:' as info;
SELECT 'admin / admin123 (관리자)' as account1;
SELECT 'user1 / user123 (일반사용자)' as account2;
