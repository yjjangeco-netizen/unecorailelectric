-- Todos 테이블 생성
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

-- 코멘트 추가
COMMENT ON TABLE todos IS '할 일 목록 테이블';
COMMENT ON COLUMN todos.id IS 'UUID 기본키';
COMMENT ON COLUMN todos.user_id IS '사용자 ID (users 테이블 참조)';
COMMENT ON COLUMN todos.title IS '할 일 제목';
COMMENT ON COLUMN todos.completed IS '완료 여부';
COMMENT ON COLUMN todos.due_date IS '마감일';
COMMENT ON COLUMN todos.priority IS '우선순위 (low, medium, high)';
COMMENT ON COLUMN todos.category IS '카테고리';
COMMENT ON COLUMN todos.created_at IS '생성일시';
COMMENT ON COLUMN todos.updated_at IS '수정일시';

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 할일만 조회 가능
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::TEXT);

-- RLS 정책: 사용자는 자신의 할일만 생성 가능
CREATE POLICY "Users can create their own todos" ON todos
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::TEXT);

-- RLS 정책: 사용자는 자신의 할일만 수정 가능
CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::TEXT);

-- RLS 정책: 사용자는 자신의 할일만 삭제 가능
CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::TEXT);

