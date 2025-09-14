import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

// GET: 연차/반차 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const leave_type = searchParams.get('leave_type')
    const user_id = searchParams.get('user_id')

    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        users:user_id(
          first_name,
          last_name,
          department,
          position
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (leave_type && leave_type !== 'all') {
      query = query.eq('leave_type', leave_type)
    }
    if (user_id && user_id !== 'all') {
      query = query.eq('user_id', user_id)
    }

    // 관리자가 아닌 경우 자신의 신청만 조회
    if (user.user_metadata?.['level'] !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leave requests:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests: data })
  } catch (error) {
    console.error('Unexpected error in GET /api/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: 연차/반차 신청
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      leave_type,
      start_date,
      end_date,
      start_time,
      end_time,
      total_days,
      reason
    } = body

    // 연차 잔여일수 확인 (연차인 경우)
    if (leave_type === 'annual') {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('remaining_annual_leave')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (userData.remaining_annual_leave < total_days) {
        return NextResponse.json({ 
          error: 'Insufficient annual leave remaining' 
        }, { status: 400 })
      }
    }

    // 중복 신청 확인 (같은 날짜에 이미 신청한 연차/반차가 있는지)
    const { data: existingRequests, error: checkError } = await supabase
      .from('leave_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('start_date', start_date)
      .in('status', ['pending', 'approved'])

    if (checkError) {
      console.error('Error checking existing requests:', checkError)
      return NextResponse.json({ error: 'Failed to check existing requests' }, { status: 500 })
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json({ 
        error: 'Already have a leave request for this date' 
      }, { status: 400 })
    }

    // 연차/반차 신청 생성
    const { data: leaveRequest, error: createError } = await supabase
      .from('leave_requests')
      .insert({
        user_id: user.id,
        leave_type,
        start_date,
        end_date,
        start_time: start_time || null,
        end_time: end_time || null,
        total_days,
        reason,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating leave request:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ request: leaveRequest }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: 연차/반차 신청 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // 권한 확인 (본인의 신청이거나 관리자)
    const { data: existingRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.user_id !== user.id && user.user_metadata?.['level'] !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 승인된 신청은 수정 불가
    if (existingRequest.status === 'approved') {
      return NextResponse.json({ error: 'Cannot modify approved request' }, { status: 400 })
    }

    const { data: leaveRequest, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating leave request:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ request: leaveRequest })
  } catch (error) {
    console.error('Unexpected error in PUT /api/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH: 연차/반차 승인/거부
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자만 승인/거부 가능
    if (user.user_metadata?.['level'] !== 'admin' && user.user_metadata?.['level'] !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, rejection_reason } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // 신청 정보 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('user_id, leave_type, total_days, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (action === 'reject' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    // 연차인 경우 잔여일수 차감
    if (action === 'approve' && existingRequest.leave_type === 'annual') {
      // 먼저 현재 잔여일수 조회
      const { data: userData, error: fetchUserError } = await supabase
        .from('users')
        .select('remaining_annual_leave')
        .eq('id', existingRequest.user_id)
        .single()

      if (fetchUserError) {
        console.error('Error fetching user data:', fetchUserError)
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
      }

      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          remaining_annual_leave: userData.remaining_annual_leave - existingRequest.total_days
        })
        .eq('id', existingRequest.user_id)

      if (updateUserError) {
        console.error('Error updating remaining annual leave:', updateUserError)
        return NextResponse.json({ error: 'Failed to update remaining leave' }, { status: 500 })
      }
    }

    const { data: leaveRequest, error: updateError } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating leave request:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ request: leaveRequest })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: 연차/반차 신청 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // 권한 확인
    const { data: existingRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.user_id !== user.id && user.user_metadata?.['level'] !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 승인된 신청은 삭제 불가
    if (existingRequest.status === 'approved') {
      return NextResponse.json({ error: 'Cannot delete approved request' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting leave request:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
