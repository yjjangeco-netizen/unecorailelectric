import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 일정 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const projectId = searchParams.get('projectId')
    const participantId = searchParams.get('participantId')

    console.log('일정 조회 파라미터:', {
      startDate,
      endDate,
      category,
      projectId,
      participantId
    })

    // 로컬 이벤트 조회
    let localEventsQuery = supabase
      .from('local_events')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number
        ),
        users:participant_id (
          id,
          name,
          level
        ),
        created_by:created_by_id (
          id,
          name,
          level
        )
      `)
      .order('start_date', { ascending: true })

    // 날짜 범위 필터
    if (startDate) {
      localEventsQuery = localEventsQuery.gte('start_date', startDate)
    }
    if (endDate) {
      localEventsQuery = localEventsQuery.lte('start_date', endDate)
    }

    // 카테고리 필터
    if (category && category !== 'all') {
      localEventsQuery = localEventsQuery.eq('category', category)
    }

    // 프로젝트 필터
    if (projectId && projectId !== 'all') {
      localEventsQuery = localEventsQuery.eq('project_id', projectId)
    }

    // 참여자 필터
    if (participantId && participantId !== 'all') {
      localEventsQuery = localEventsQuery.eq('participant_id', participantId)
    }

    const { data: localEvents, error: localEventsError } = await localEventsQuery

    if (localEventsError) {
      console.error('로컬 이벤트 조회 오류:', localEventsError)
      return NextResponse.json(
        { error: '로컬 이벤트 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 프로젝트 이벤트 조회
    let projectEventsQuery = supabase
      .from('project_events')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number
        )
      `)
      .order('event_date', { ascending: true })

    // 날짜 범위 필터
    if (startDate) {
      projectEventsQuery = projectEventsQuery.gte('event_date', startDate)
    }
    if (endDate) {
      projectEventsQuery = projectEventsQuery.lte('event_date', endDate)
    }

    // 프로젝트 필터
    if (projectId && projectId !== 'all') {
      projectEventsQuery = projectEventsQuery.eq('project_id', projectId)
    }

    const { data: projectEvents, error: projectEventsError } = await projectEventsQuery

    if (projectEventsError) {
      console.error('프로젝트 이벤트 조회 오류:', projectEventsError)
      return NextResponse.json(
        { error: '프로젝트 이벤트 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 데이터 변환
    const transformedLocalEvents = (localEvents || []).map(event => ({
      id: event.id,
      category: event.category,
      subCategory: event.sub_category,
      subSubCategory: event.sub_sub_category,
      projectType: event.project_type,
      projectId: event.project_id,
      customProject: event.custom_project,
      summary: event.summary,
      description: event.description,
      startDateTime: event.start_date_time,
      startDate: event.start_date,
      endDateTime: event.end_date_time,
      endDate: event.end_date,
      location: event.location,
      participantId: event.participant_id,
      createdById: event.created_by_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      project: event.projects ? {
        id: event.projects.id,
        projectName: event.projects.project_name,
        projectNumber: event.projects.project_number
      } : null,
      participant: event.users ? {
        id: event.users.id,
        name: event.users.name,
        level: event.users.level
      } : null,
      createdBy: event.created_by ? {
        id: event.created_by.id,
        name: event.created_by.name,
        level: event.created_by.level
      } : null
    }))

    const transformedProjectEvents = (projectEvents || []).map(event => ({
      id: event.id,
      projectId: event.project_id,
      eventType: event.event_type,
      eventDate: event.event_date,
      description: event.description,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      project: event.projects ? {
        id: event.projects.id,
        projectName: event.projects.project_name,
        projectNumber: event.projects.project_number
      } : null
    }))

    return NextResponse.json({
      localEvents: transformedLocalEvents,
      projectEvents: transformedProjectEvents
    })
  } catch (error) {
    console.error('일정 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 일정 생성
export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const body = await request.json()
    const { type, ...eventData } = body

    if (type === 'local') {
      // 로컬 이벤트 생성
      const { data, error } = await supabase
        .from('local_events')
        .insert({
          id: eventData.id || `local_${Date.now()}`,
          category: eventData.category,
          sub_category: eventData.subCategory,
          sub_sub_category: eventData.subSubCategory,
          project_type: eventData.projectType,
          project_id: eventData.projectId || null,
          custom_project: eventData.customProject,
          summary: eventData.summary,
          description: eventData.description,
          start_date_time: eventData.startDateTime,
          start_date: eventData.startDate,
          end_date_time: eventData.endDateTime,
          end_date: eventData.endDate,
          location: eventData.location,
          participant_id: eventData.participantId,
          created_by_id: eventData.createdById,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('로컬 이벤트 생성 오류:', error)
        return NextResponse.json(
          { error: '로컬 이벤트 생성에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 201 })
    } else if (type === 'project') {
      // 프로젝트 이벤트 생성
      const { data, error } = await supabase
        .from('project_events')
        .insert({
          id: eventData.id || `project_${Date.now()}`,
          project_id: eventData.projectId,
          event_type: eventData.eventType,
          event_date: eventData.eventDate,
          description: eventData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('프로젝트 이벤트 생성 오류:', error)
        return NextResponse.json(
          { error: '프로젝트 이벤트 생성에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 201 })
    } else {
      return NextResponse.json(
        { error: '잘못된 이벤트 타입입니다' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('일정 생성 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 일정 수정
export async function PUT(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const body = await request.json()
    const { type, id, ...updateData } = body

    if (type === 'local') {
      // 로컬 이벤트 수정
      const { data, error } = await supabase
        .from('local_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('로컬 이벤트 수정 오류:', error)
        return NextResponse.json(
          { error: '로컬 이벤트 수정에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else if (type === 'project') {
      // 프로젝트 이벤트 수정
      const { data, error } = await supabase
        .from('project_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('프로젝트 이벤트 수정 오류:', error)
        return NextResponse.json(
          { error: '프로젝트 이벤트 수정에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: '잘못된 이벤트 타입입니다' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('일정 수정 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 일정 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { searchParams } = request.nextUrl
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: '타입과 ID가 필요합니다' },
        { status: 400 }
      )
    }

    if (type === 'local') {
      // 로컬 이벤트 삭제
      const { error } = await supabase
        .from('local_events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('로컬 이벤트 삭제 오류:', error)
        return NextResponse.json(
          { error: '로컬 이벤트 삭제에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: '로컬 이벤트가 삭제되었습니다' })
    } else if (type === 'project') {
      // 프로젝트 이벤트 삭제
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('프로젝트 이벤트 삭제 오류:', error)
        return NextResponse.json(
          { error: '프로젝트 이벤트 삭제에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: '프로젝트 이벤트가 삭제되었습니다' })
    } else {
      return NextResponse.json(
        { error: '잘못된 이벤트 타입입니다' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('일정 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
