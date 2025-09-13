import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(_request: NextRequest) {
  try {
    // 모든 사용자 정보 조회 (RLS 적용)
    const { data: users, error } = await supabaseServer
      .from('users')
      .select(`
        id,
        name,
        email,
        department,
        position,
        level,
        is_active,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('사용자 목록 조회 오류, Mock 데이터 사용:', error)
      // Mock 데이터 반환
      const mockUsers = [
        {
          id: 'user1',
          name: '김전기',
          email: 'kim@example.com',
          department: '전기팀',
          position: '선임기술자',
          level: '3',
          is_active: true,
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
        },
        {
          id: 'user2',
          name: '이전기',
          email: 'lee@example.com',
          department: '전기팀',
          position: '기술자',
          level: '2',
          is_active: true,
          createdAt: '2024-01-02T09:00:00Z',
          updatedAt: '2024-01-14T10:30:00Z'
        },
        {
          id: 'user3',
          name: '박전기',
          email: 'park@example.com',
          department: '전기팀',
          position: '주임기술자',
          level: '4',
          is_active: true,
          createdAt: '2024-01-03T09:00:00Z',
          updatedAt: '2024-01-13T14:20:00Z'
        }
      ]
      
      return NextResponse.json({ users: mockUsers })
    }

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      level: user.level,
      is_active: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, username, password, name, department, position, email, level } = await request.json()

    // 사용자 생성
    const { data, error } = await supabaseServer
      .from('users')
      .insert({
        id,
        username,
        password,
        name,
        department,
        position,
        email,
        level,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('사용자 생성 오류:', error)
      return NextResponse.json(
        { error: '사용자 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '사용자가 성공적으로 생성되었습니다.',
      user: data[0]
    })
  } catch (error) {
    console.error('사용자 생성 오류:', error)
    return NextResponse.json(
      { error: '사용자 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, department, position, level, is_active } = await request.json()

    console.log('사용자 업데이트 요청:', { id, name, department, position, level, is_active })

    // 사용자 정보 업데이트
    const { data, error } = await supabaseServer
      .from('users')
      .update({
        name,
        department,
        position,
        level,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('사용자 정보 업데이트 오류:', error)
      return NextResponse.json(
        { error: '사용자 정보를 업데이트하는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    console.log('사용자 업데이트 성공:', data)

    return NextResponse.json({ 
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: data[0]
    })
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error)
    return NextResponse.json(
      { error: '사용자 정보를 업데이트하는데 실패했습니다.', details: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}
