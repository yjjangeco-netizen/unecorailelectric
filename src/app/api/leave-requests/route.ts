import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const userLevel = request.headers.get('x-user-level') || '1'
    
    // 레벨 5 이상 또는 administrator만 모든 연차 조회 가능
    const canViewAll = userLevel === '5' || userLevel === 'administrator'
    
    const supabase = createApiClient()
    
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        users!leave_requests_user_id_fkey (
          id,
          name
        )
      `)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
    
    // 레벨이 낮으면 자신의 것만
    if (!canViewAll) {
      const userId = request.headers.get('x-user-id')
      if (userId) {
        query = query.eq('user_id', userId)
      }
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('연차 조회 오류:', error)
      return NextResponse.json({ error: '연차 조회 실패' }, { status: 500 })
    }
    
    // 사용자 정보 포함하여 반환
    const leaveRequests = data?.map(request => ({
      ...request,
      user_name: request.users?.name || 'Unknown'
    })) || []
    
    return NextResponse.json(leaveRequests)
    
  } catch (error) {
    console.error('연차 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leaveId = searchParams.get('id')
    
    if (!leaveId) {
      return NextResponse.json({ error: '연차/반차 ID가 필요합니다' }, { status: 400 })
    }

    const body = await request.json()
    const supabase = createApiClient()

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        leave_type: body.leave_type,
        start_date: body.start_date,
        end_date: body.end_date,
        start_time: body.start_time,
        end_time: body.end_time,
        total_days: body.total_days,
        reason: body.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', leaveId)
      .select()

    if (error) {
      console.error('연차/반차 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('연차/반차 수정 실패:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leaveId = searchParams.get('id')
    
    if (!leaveId) {
      return NextResponse.json({ error: 'Leave ID is required' }, { status: 400 })
    }
    
    const supabase = createApiClient()
    
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', leaveId)
    
    if (error) {
      console.error('연차 삭제 오류:', error)
      return NextResponse.json({ error: '연차 삭제 실패' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('연차 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('연차 신청 요청 데이터:', body)
    
    const { user_id, leave_type, start_date, end_date, start_time, end_time, total_days, reason } = body
    
    if (!user_id || !leave_type || !start_date || !end_date) {
      console.log('필수 필드 누락:', { user_id, leave_type, start_date, end_date })
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }
    
    const supabase = createApiClient()
    console.log('Supabase 클라이언트 생성 완료')
    
    const insertData = {
      user_id,
      leave_type,
      start_date,
      end_date,
      start_time,
      end_time,
      total_days: total_days || 1,
      reason: reason || '개인사유',
      status: 'approved'  // 즉시 승인 상태로 등록
    }
    
    console.log('삽입할 데이터:', insertData)
    
    const { data, error } = await supabase
      .from('leave_requests')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('연차 신청 오류:', error)
      console.error('에러 상세:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: `연차 신청 실패: ${error.message}` }, { status: 500 })
    }
    
    console.log('연차 신청 성공:', data)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('연차 신청 API 오류:', error)
    return NextResponse.json({ error: `서버 오류: ${error.message}` }, { status: 500 })
  }
}