-- ========================================
-- 업무일지 관련 테이블 생성 (간단 버전)
-- ========================================

-- 1. 프로젝트 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 업무일지 테이블 생성
CREATE TABLE IF NOT EXISTS work_diary (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    work_date DATE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    work_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기본 프로젝트 데이터 삽입
INSERT INTO projects (name, description) VALUES
('전기설비 유지보수', '전기설비 점검 및 유지보수 작업'),
('신규 설치', '새로운 전기설비 설치 작업'),
('고장 수리', '전기설비 고장 수리 및 복구'),
('점검 작업', '정기 점검 및 안전점검'),
('기타 업무', '기타 전기 관련 업무')
ON CONFLICT (name) DO NOTHING;

-- 4. 샘플 업무일지 데이터 삽입
INSERT INTO work_diary (user_id, work_date, project_id, work_content) VALUES
('user1', '2024-01-15', 1, 'A동 전기실 정기점검 및 배전반 상태 확인'),
('user2', '2024-01-15', 2, 'B동 신규 전기설비 설치 및 배선 작업'),
('user1', '2024-01-14', 3, 'C동 조명 고장 수리 및 교체 작업')
ON CONFLICT DO NOTHING;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_diary_user_id ON work_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_work_diary_date ON work_diary(work_date);
CREATE INDEX IF NOT EXISTS idx_work_diary_project ON work_diary(project_id);

-- 6. RLS 정책 설정
ALTER TABLE work_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로젝트 조회 가능
DROP POLICY IF EXISTS "Users can view projects" ON projects;
CREATE POLICY "Users can view projects" ON projects
    FOR SELECT USING (true);

-- 모든 사용자가 업무일지 조회 가능 (개발용)
DROP POLICY IF EXISTS "Users can view work diary" ON work_diary;
CREATE POLICY "Users can view work diary" ON work_diary
    FOR SELECT USING (true);

-- 모든 사용자가 업무일지 관리 가능 (개발용)
DROP POLICY IF EXISTS "Users can manage work diary" ON work_diary;
CREATE POLICY "Users can manage work diary" ON work_diary
    FOR ALL USING (true);

-- 7. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_work_diary_updated_at ON work_diary;
CREATE TRIGGER update_work_diary_updated_at 
    BEFORE UPDATE ON work_diary 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
