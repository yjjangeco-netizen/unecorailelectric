import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 개별 사용자 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    console.log('🔍 개별 사용자 조회 요청:', { userId })

    const supabase = supabaseServer

    // ID를 숫자로 변환 (Supabase users 테이블의 id는 INTEGER)
    const numericUserId = parseInt(userId)
    if (isNaN(numericUserId)) {
      return NextResponse.json({
        error: '잘못된 사용자 ID 형식입니다'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', numericUserId)
      .single()

    if (error) {
      console.error('❌ Supabase 조회 오류:', error)
      return NextResponse.json({
        error: '사용자 조회에 실패했습니다',
        details: error
      }, { status: 500 })
    }

    if (!data) {
      console.log(`⚠️  사용자 ID ${numericUserId} 없음`)
      return NextResponse.json({
        error: '사용자를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // 데이터 변환
    const user = {
      id: data.id.toString(),
      name: data.name || '',
      email: data.email || '',
      department: data.department || '',
      position: data.position || '',
      level: data.level || 'user',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    }

    console.log('✅ 조회된 사용자:', user)

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error)
    return NextResponse.json({
      error: '사용자 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
