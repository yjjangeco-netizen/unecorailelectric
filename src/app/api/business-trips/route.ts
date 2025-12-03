import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// GET: 출장/외근 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('출장/외근 API GET 요청 시작')
    const userLevel = request.headers.get('x-user-level') || '1'
    console.log('사용자 레벨:', userLevel)

    const supabase = createApiClient()

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const trip_type = searchParams.get('trip_type')
    const project_id = searchParams.get('project_id')

    console.log('쿼리 파라미터:', { status, trip_type, project_id })

    // 기본 조회 (프로젝트 조인 제거 - 별도로 처리)
    let query = supabase
      .from('business_trips')
      .select('*')
      .order('created_at', { ascending: false })

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (trip_type && trip_type !== 'all') {
      query = query.eq('trip_type', trip_type)
    }
    if (project_id && project_id !== 'all') {
      query = query.eq('project_id', project_id)
    }

    console.log('Supabase 쿼리 실행 중...')
    const { data, error } = await query
    console.log('Supabase 쿼리 결과:', { data, error })

    if (error) {
      console.error('출장/외근 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 프로젝트 이름을 추가하여 반환
    const tripsWithProjects = data?.map(trip => ({
      ...trip,
      project_name: trip.projects?.project_name || null
    })) || []
    
    console.log('출장/외근 API 응답 데이터:', tripsWithProjects)
    return NextResponse.json(tripsWithProjects)
  } catch (error) {
    console.error('출장/외근 API 예상치 못한 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: 출장/외근 신청
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    const body = await request.json()
    console.log('출장/외근 신청 요청 데이터:', body)
    
    // snake_case와 camelCase 모두 지원
    const userId = body.user_id || body.userId
    const userName = body.user_name || body.userName

    if (!userId) {
      console.log('User ID 누락')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 출장/외근 생성
    const insertData = {
      user_id: userId,
      user_name: userName || 'Unknown',
      trip_type: body.trip_type || 'field_work',
      category: body.category || 'project',
      sub_type: body.sub_type || null,
      project_id: body.project_id || null,
      title: body.title,
      purpose: body.purpose,
      location: body.location,
      start_date: body.start_date,
      end_date: body.end_date,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      status: body.status || 'approved'
    }
    
    console.log('DB에 삽입할 데이터:', insertData)
    
    const { data: trip, error: tripError } = await supabase
      .from('business_trips')
      .insert(insertData)
      .select()
      .single()

    if (tripError) {
      console.error('출장/외근 생성 오류:', tripError)
      return NextResponse.json({ error: tripError.message }, { status: 500 })
    }
    
    console.log('출장/외근 생성 성공:', trip)

    // 동행자 추가는 일단 생략 (필요시 나중에 추가)

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/business-trips:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: 출장/외근 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // 권한 확인 (본인의 출장이거나 관리자)
    const { data: existingTrip, error: fetchError } = await supabase
      .from('business_trips')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (existingTrip.user_id !== user.id && user.user_metadata?.['level'] !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 승인된 출장은 수정 불가
    if (existingTrip.status === 'approved') {
      return NextResponse.json({ error: 'Cannot modify approved trip' }, { status: 400 })
    }

    const { data: trip, error: updateError } = await supabase
      .from('business_trips')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating business trip:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Unexpected error in PUT /api/business-trips:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: 출장/외근 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    // 헤더에서 사용자 정보 확인 (일정 관리에서 사용)
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')
    
    let user = null
    if (userId) {
      user = { id: userId, user_metadata: { level: userLevel } }
    } else {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // 출장/외근 존재 확인 및 권한 체크
    const { data: existingTrip, error: fetchError } = await supabase
      .from('business_trips')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // 권한 확인: 본인 또는 admin만 삭제 가능
    const isAdmin = user.user_metadata?.level === 'admin' || user.user_metadata?.level === 'administrator' || user.user_metadata?.level === '5'
    const isOwner = existingTrip.user_id === user.id
    
    if (!isOwner && !isAdmin) {
      console.log('삭제 권한 없음:', { userId: user.id, tripUserId: existingTrip.user_id, userLevel: user.user_metadata?.level })
      return NextResponse.json({ 
        error: 'Forbidden: 본인의 출장/외근이거나 관리자만 삭제할 수 있습니다' 
      }, { status: 403 })
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('business_trips')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('출장/외근 삭제 오류:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/business-trips:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}