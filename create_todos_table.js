// todos 테이블 생성 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTodosTable() {
  console.log('📋 todos 테이블 생성 시도...\n')

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      due_date DATE,
      priority TEXT DEFAULT 'medium',
      category TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
    CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  `

  console.log('⚠️  주의: Supabase JS 클라이언트로는 테이블 생성이 불가능합니다.')
  console.log('아래 SQL을 Supabase Dashboard의 SQL Editor에서 실행해주세요:\n')
  console.log('==========================================')
  console.log(createTableSQL)
  console.log('==========================================\n')
  console.log('📍 Supabase Dashboard: https://supabase.com/dashboard/project/esvpnrqavaeikzhbmydz/editor')
}

createTodosTable()

