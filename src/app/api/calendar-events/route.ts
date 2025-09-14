import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

// GET: 캘린더 이벤트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true })
    
    // 날짜 범위 필터링
    if (start) {
      query = query.gte('start_date', start)
    }
    if (end) {
      query = query.lte('start_date', end)
    }
    
    const { data: events, error } = await query
    
    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({ error: '이벤트를 불러오는데 실패했습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Error in GET /api/calendar-events:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 새 캘린더 이벤트 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      title,
      start_date,
      end_date,
      start_time,
      end_time,
      category,
      sub_category,
      description,
      location,
      participant_id,
      companions = []
    } = body
    
    // 필수 필드 검증
    if (!title || !start_date) {
      return NextResponse.json({ error: '제목과 시작일은 필수입니다.' }, { status: 400 })
    }
    
    // 이벤트 데이터 생성
    const eventData = {
      title,
      start_date,
      end_date: end_date || start_date,
      start_time: start_time || null,
      end_time: end_time || null,
      category: category || '기타',
      sub_category: sub_category || null,
      description: description || null,
      location: location || null,
      participant_id: participant_id || user.id,
      companions: companions.length > 0 ? companions : null,
      created_by: user.id,
      created_at: new Date().toISOString()
    }
    
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert([eventData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating calendar event:', error)
      return NextResponse.json({ error: '이벤트 생성에 실패했습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/calendar-events:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PUT: 캘린더 이벤트 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 })
    }
    
    // 권한 확인 (본인이 생성한 이벤트만 수정 가능)
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('created_by')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    if (existingEvent.created_by !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }
    
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating calendar event:', error)
      return NextResponse.json({ error: '이벤트 수정에 실패했습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error in PUT /api/calendar-events:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE: 캘린더 이벤트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 })
    }
    
    // 권한 확인 (본인이 생성한 이벤트만 삭제 가능)
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('created_by')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    if (existingEvent.created_by !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }
    
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting calendar event:', error)
      return NextResponse.json({ error: '이벤트 삭제에 실패했습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ message: '이벤트가 삭제되었습니다.' })
  } catch (error) {
    console.error('Error in DELETE /api/calendar-events:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
