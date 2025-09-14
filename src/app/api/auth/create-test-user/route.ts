import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(_request: NextRequest) {
  try {
    console.log('=== 테스트 사용자 생성 ===')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 먼저 users 테이블 구조 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    console.log('테이블 구조 확인:', { tableInfo, tableError })

    // 테스트 사용자 데이터 (기본 컬럼만 사용)
    const testUsers = [
      {
        username: 'admin',
        password: 'admin123',
        level: '5',
        department: '전기팀',
        position: '팀장'
      },
      {
        username: 'yjjang',
        password: 'yjjang123',
        level: '3',
        department: '전기팀',
        position: '대리'
      },
      {
        username: 'test',
        password: 'test123',
        level: '2',
        department: '전기팀',
        position: '사원'
      }
    ]

    const results = []

    for (const user of testUsers) {
      try {
        // 비밀번호 해시화
        const password_hash = await bcrypt.hash(user.password, 10)
        
        // 사용자 생성 (기본 컬럼만 사용)
        const { data, error } = await supabase
          .from('users')
          .insert({
            username: user.username,
            password_hash: password_hash,
            level: user.level,
            department: user.department,
            position: user.position
          })
          .select()

        if (error) {
          console.error(`${user.username} 생성 오류:`, error)
          results.push({
            username: user.username,
            success: false,
            error: error.message
          })
        } else {
          console.log(`${user.username} 생성 성공:`, data)
          results.push({
            username: user.username,
            success: true,
            data: data
          })
        }
      } catch (err) {
        console.error(`${user.username} 생성 중 오류:`, err)
        results.push({
          username: user.username,
          success: false,
          error: '생성 중 오류 발생'
        })
      }
    }

    return NextResponse.json({
      message: '테스트 사용자 생성 완료',
      results: results
    })
  } catch (error) {
    console.error('테스트 사용자 생성 오류:', error)
    return NextResponse.json(
      { error: '테스트 사용자를 생성할 수 없습니다' },
      { status: 500 }
    )
  }
}