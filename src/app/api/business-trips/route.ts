import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

// GET: 출장/외근 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const trip_type = searchParams.get('trip_type')
    const project_id = searchParams.get('project_id')

    let query = supabase
      .from('business_trips')
      .select(`
        *,
        companions:trip_companions(
          user_id,
          users:user_id(
            first_name,
            last_name
          )
        )
      `)
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

    // 관리자가 아닌 경우 자신의 출장만 조회
    if (user.user_metadata?.['level'] !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching business trips:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trips: data })
  } catch (error) {
    console.error('Unexpected error in GET /api/business-trips:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: 출장/외근 신청
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      trip_type,
      sub_type,
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      location,
      purpose,
      project_id,
      companions
    } = body

    // 출장/외근 생성
    const { data: trip, error: tripError } = await supabase
      .from('business_trips')
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        trip_type,
        sub_type,
        title,
        description,
        start_date,
        end_date,
        start_time: start_time || null,
        end_time: end_time || null,
        location,
        purpose,
        status: 'pending'
      })
      .select()
      .single()

    if (tripError) {
      console.error('Error creating business trip:', tripError)
      return NextResponse.json({ error: tripError.message }, { status: 500 })
    }

    // 동행자 추가
    if (companions && companions.length > 0) {
      const companionData = companions.map((companionId: string) => ({
        trip_id: trip.id,
        user_id: companionId
      }))

      const { error: companionError } = await supabase
        .from('trip_companions')
        .insert(companionData)

      if (companionError) {
        console.error('Error adding companions:', companionError)
        // 출장은 생성되었으므로 에러를 로그만 남기고 계속 진행
      }
    }

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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // 권한 확인
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

    // 승인된 출장은 삭제 불가
    if (existingTrip.status === 'approved') {
      return NextResponse.json({ error: 'Cannot delete approved trip' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('business_trips')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting business trip:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/business-trips:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}