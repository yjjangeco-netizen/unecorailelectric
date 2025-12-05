import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    console.log('이벤트 API GET 요청 시작')
    const userLevel = request.headers.get('x-user-level') || '1'
    const userId = request.headers.get('x-user-id')
    
    console.log('헤더 정보:', { userLevel, userId })
    
    const supabase = supabaseServer
    
    // RLS 우회를 위해 모든 데이터 조회
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
    
    console.log('Supabase 쿼리 결과:', { data, error })
    
    if (error) {
      console.error('이벤트 조회 오류:', error)
      return NextResponse.json({ error: '이벤트 조회 실패' }, { status: 500 })
    }
    
    console.log('이벤트 API 응답 데이터:', data)
    return NextResponse.json(data || [])
    
  } catch (error) {
    console.error('이벤트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다' }, { status: 400 })
    }

    const body = await request.json()
    const supabase = supabaseServer

    const { data, error } = await supabase
      .from('events')
      .update({
        category: body.category,
        summary: body.title || body.location,
        description: body.purpose || body.description,
        location: body.location,
        start_date: body.start_date,
        start_time: body.start_time,
        end_date: body.end_date,
        end_time: body.end_time
      })
      .eq('id', eventId)
      .select()

    if (error) {
      console.error('이벤트 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('이벤트 수정 실패:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다' }, { status: 400 })
    }

    const supabase = supabaseServer

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('이벤트 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('이벤트 삭제 실패:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('이벤트 생성 요청 데이터:', body)
    const userLevel = request.headers.get('x-user-level') || '1'
    
    const {
      category,
      subCategory,
      subSubCategory,
      projectType,
      projectId,
      customProject,
      summary,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      participantId,
      participantName,
      participantLevel,
      companions,
      createdById,
      createdByName,
      createdByLevel
    } = body
    
    console.log('필수 필드 체크:', { category, summary, startDate, endDate, participantId })
    
    if (!category || !summary || !startDate || !endDate || !participantId) {
      console.log('필수 필드 누락:', { category, summary, startDate, endDate, participantId })
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }
    
    const supabase = supabaseServer
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        category,
        sub_category: subCategory,
        sub_sub_category: subSubCategory,
        project_type: projectType,
        project_id: projectId,
        custom_project: customProject,
        summary,
        description: description || null,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location: location || null,
        participant_id: participantId,
        participant_name: participantName,
        participant_level: participantLevel || '1',
        companions: companions || [],
        created_by_id: createdById || participantId,
        created_by_name: createdByName || participantName,
        created_by_level: createdByLevel || '1'
      })
      .select()
      .single()
    
    if (error) {
      console.error('이벤트 생성 오류:', error)
      console.error('오류 상세:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: `이벤트 생성 실패: ${error.message}` }, { status: 500 })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('이벤트 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
