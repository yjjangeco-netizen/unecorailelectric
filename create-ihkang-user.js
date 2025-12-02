/**
 * DB에 ihkang 사용자를 생성하는 스크립트
 * 
 * 실행 방법: node create-ihkang-user.js
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createOrUpdateUser() {
  try {
    console.log('ihkang 사용자를 생성/업데이트합니다...')
    
    // 비밀번호 해시 생성
    const password = '1234' // 원하는 비밀번호로 변경하세요
    const hashedPassword = await bcrypt.hash(password, 10)
    
    console.log('비밀번호 해시 생성 완료')
    
    // 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'ihkang')
      .maybeSingle()
    
    if (existingUser) {
      console.log('기존 사용자 발견, 업데이트합니다...')
      
      // 기존 사용자 업데이트
      const { data, error } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          is_active: true,
          level: '3',
          name: '강인혁',
          department: '전기팀',
          position: '사원',
          email: 'ihkang@example.com',
          stock_view: true,
          stock_in: true,
          stock_out: true,
          stock_disposal: false,
          work_tools: true,
          daily_log: true,
          work_manual: true,
          sop: true,
          user_management: false,
          updated_at: new Date().toISOString()
        })
        .eq('username', 'ihkang')
        .select()
      
      if (error) {
        console.error('업데이트 오류:', error)
        return
      }
      
      console.log('✅ 사용자가 성공적으로 업데이트되었습니다!')
      console.log('사용자명: ihkang')
      console.log('비밀번호:', password)
      console.log('레벨: 3')
    } else {
      console.log('새 사용자를 생성합니다...')
      
      // UUID 생성
      const userId = `ihkang_${Date.now()}`
      
      // 새 사용자 생성
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: 'ihkang',
          password: hashedPassword,
          is_active: true,
          level: '3',
          name: '강인혁',
          department: '전기팀',
          position: '사원',
          email: 'ihkang@example.com',
          stock_view: true,
          stock_in: true,
          stock_out: true,
          stock_disposal: false,
          work_tools: true,
          daily_log: true,
          work_manual: true,
          sop: true,
          user_management: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('생성 오류:', error)
        return
      }
      
      console.log('✅ 사용자가 성공적으로 생성되었습니다!')
      console.log('사용자명: ihkang')
      console.log('비밀번호:', password)
      console.log('레벨: 3')
    }
    
    // 확인
    const { data: verifyUser } = await supabase
      .from('users')
      .select('username, level, is_active, password')
      .eq('username', 'ihkang')
      .single()
    
    console.log('\n현재 사용자 정보:')
    console.log('- username:', verifyUser.username)
    console.log('- level:', verifyUser.level)
    console.log('- is_active:', verifyUser.is_active)
    console.log('- password 해시 있음:', !!verifyUser.password)
    
  } catch (err) {
    console.error('오류 발생:', err)
  }
}

createOrUpdateUser()
