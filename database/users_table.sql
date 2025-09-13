-- 직책과 부서 ENUM 타입 생성
CREATE TYPE position_type AS ENUM ('사원', '대리', '과장', '차장', '부장', '임원');
CREATE TYPE department_type AS ENUM ('전기팀', 'AS', '기계', '구매', '영업');

-- 권한 ENUM 타입 생성 (새로운 6단계 권한 체계)
CREATE TYPE permission_type AS ENUM ('level1', 'level2', 'level3', 'level4', 'level5', 'administrator');

-- 회원관리 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,                    -- 이름(성명)
    department department_type NOT NULL,           -- 부서 (선택)
    position position_type NOT NULL,               -- 직책 (선택)
    email VARCHAR(255),
    permissions permission_type[] DEFAULT ARRAY['level1']::permission_type[], -- 권한 배열
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 샘플 데이터는 제거됨
-- 실제 운영 환경에서는 관리자가 직접 사용자 계정을 추가하세요

-- RLS 정책 설정 (보안)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 정책 설정
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

-- 권한 기반 정책 설정 (새로운 6단계 권한 체계)
-- 읽기 권한: level1 이상 모든 사용자
CREATE POLICY "Users can view based on permissions" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user', true)::text 
            AND (u.permissions @> ARRAY['level1'] OR u.permissions @> ARRAY['level2'] OR u.permissions @> ARRAY['level3'] OR u.permissions @> ARRAY['level4'] OR u.permissions @> ARRAY['level5'] OR u.permissions @> ARRAY['administrator'])
        )
    );

-- 쓰기 권한: level2 이상 사용자
CREATE POLICY "Users can write based on permissions" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user', true)::text 
            AND (u.permissions @> ARRAY['level2'] OR u.permissions @> ARRAY['level3'] OR u.permissions @> ARRAY['level4'] OR u.permissions @> ARRAY['level5'] OR u.permissions @> ARRAY['administrator'])
        )
    );

-- 관리자 권한: level5, administrator 권한자만
CREATE POLICY "Only admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user', true)::text 
            AND (u.permissions @> ARRAY['level5'] OR u.permissions @> ARRAY['administrator'])
        )
    );

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_position ON users(position);

-- 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
