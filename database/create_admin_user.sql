-- ========================================
-- 관리자 계정 생성 스크립트
-- 실제 운영 환경용 관리자 계정 추가
-- ========================================

-- 1. 관리자 계정 추가
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
) VALUES (
    'admin', 
    'admin', 
    'admin123', 
    '시스템 관리자', 
    '전기팀', 
    '부장', 
    'admin@unecorail.com', 
    'administrator', 
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
);

-- 2. 추가된 계정 확인
SELECT '=== 관리자 계정 추가 완료 ===' as info;
SELECT 
    id,
    username,
    name,
    department,
    position,
    level,
    is_active
FROM users 
WHERE id = 'admin';

-- 3. 로그인 테스트 안내
SELECT '이제 admin / admin123 으로 로그인할 수 있습니다.' as message;
