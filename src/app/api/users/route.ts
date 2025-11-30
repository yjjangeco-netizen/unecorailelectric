import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 확인
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: 인증이 필요합니다.' }, { status: 401 })
    }

    // 권한 확인: Level 5 또는 Admin만 조회 가능
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'

    if (!isLevel5 && !isAdmin) {
      console.log('사용자 목록 조회 권한 없음:', { userId, userLevel })
      return NextResponse.json({ 
        error: 'Forbidden: Level 5 또는 관리자만 사용자 목록을 조회할 수 있습니다.' 
      }, { status: 403 })
    }

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
        stock_view,
        stock_in,
        stock_out,
        stock_disposal,
        work_tools,
        daily_log,
        work_manual,
        sop,
        user_management,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('사용자 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '사용자 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      level: user.level,
      is_active: user.is_active,
      stock_view: user.stock_view,
      stock_in: user.stock_in,
      stock_out: user.stock_out,
      stock_disposal: user.stock_disposal,
      work_tools: user.work_tools,
      daily_log: user.daily_log,
      work_manual: user.work_manual,
      sop: user.sop,
      user_management: user.user_management,
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
    const { 
      id, name, department, position, level, is_active,
      stock_view, stock_in, stock_out, stock_disposal, 
      work_tools, daily_log, work_manual, sop, user_management 
    } = await request.json()

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
        stock_view,
        stock_in,
        stock_out,
        stock_disposal,
        work_tools,
        daily_log,
        work_manual,
        sop,
        user_management,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('사용자 삭제 요청:', userId)

    // 사용자 삭제
    const { error } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('사용자 삭제 오류:', error)
      return NextResponse.json(
        { error: '사용자 삭제에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    console.log('사용자 삭제 성공:', userId)

    return NextResponse.json({ 
      message: '사용자가 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다.', details: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}
