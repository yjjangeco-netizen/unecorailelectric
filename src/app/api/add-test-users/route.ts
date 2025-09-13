import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  try {
    console.log('테스트 사용자 추가 API 호출됨')
    
    // 테스트 사용자 데이터
    const testUsers = [
      {
        id: 'admin',
        name: '관리자',
        level: 'administrator',
        department: '전기팀',
        position: '부장',
        email: 'admin@test.com',
        password: 'admin123',
        is_active: true
      },
      {
        id: 'user1',
        name: '장영재',
        level: '5',
        department: '전기팀',
        position: '차장',
        email: 'jang@test.com',
        password: 'user123',
        is_active: true
      },
      {
        id: 'user2',
        name: '김철수',
        level: '3',
        department: '전기팀',
        position: '과장',
        email: 'kim@test.com',
        password: 'user123',
        is_active: true
      },
      {
        id: 'user3',
        name: '이영희',
        level: '2',
        department: 'AS',
        position: '대리',
        email: 'lee@test.com',
        password: 'user123',
        is_active: true
      },
      {
        id: 'user4',
        name: '박민수',
        level: '1',
        department: '기계',
        position: '사원',
        email: 'park@test.com',
        password: 'user123',
        is_active: true
      }
    ]

    // 기존 사용자 삭제 (테스트용)
    const { error: deleteError } = await supabaseServer
      .from('users')
      .delete()
      .neq('id', 'nonexistent') // 모든 레코드 삭제

    if (deleteError) {
      console.error('기존 사용자 삭제 오류:', deleteError)
    }

    // 새 사용자 추가
    const { data, error } = await supabaseServer
      .from('users')
      .insert(testUsers)
      .select()

    if (error) {
      console.error('사용자 추가 오류:', error)
      return NextResponse.json({ 
        error: '사용자 추가 실패',
        details: error.message 
      }, { status: 500 })
    }

    console.log('추가된 사용자 수:', data?.length || 0)

    return NextResponse.json({ 
      success: true,
      message: '테스트 사용자가 성공적으로 추가되었습니다.',
      userCount: data?.length || 0,
      users: data
    })
  } catch (error) {
    console.error('테스트 사용자 추가 API 오류:', error)
    return NextResponse.json({ 
      error: '테스트 사용자 추가 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
