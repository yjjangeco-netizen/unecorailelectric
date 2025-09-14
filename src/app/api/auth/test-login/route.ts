import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log('테스트 로그인 시도:', { username, password })

    // 테스트용 하드코딩된 계정
    const testUsers = [
      { username: 'admin', password: 'admin123', level: '5', name: '관리자' },
      { username: 'test', password: 'test123', level: '3', name: '테스트사용자' },
      { username: 'yjjjang', password: 'yjjjang123', level: '4', name: '유재정' }
    ]

    const user = testUsers.find(u => u.username === username && u.password === password)

    if (!user) {
      console.log('테스트 로그인 실패:', username)
      return NextResponse.json(
        { 
          error: '사용자명 또는 비밀번호가 올바르지 않습니다',
          details: '테스트 계정: admin/admin123, test/test123, yjjjang/yjjjang123'
        },
        { status: 401 }
      )
    }

    console.log('테스트 로그인 성공:', user.username)

    return NextResponse.json({
      user: {
        id: user.username,
        username: user.username,
        name: user.name,
        department: '전기팀',
        position: '팀원',
        level: user.level,
        is_active: true,
        stock_view: true,
        stock_in: user.level === '5',
        stock_out: user.level === '5',
        stock_disposal: user.level === '5',
        work_tools: user.level === '5',
        daily_log: true,
        work_manual: user.level === '5',
        sop: user.level === '5',
        user_management: user.level === '5',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('테스트 로그인 오류:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
