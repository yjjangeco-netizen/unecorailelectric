import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const body = await request.json()
    const userLevel = request.headers.get('x-user-level') || '1'
    
    const supabase = createApiClient()
    
    const updateData: any = {}
    
    if (body.category) updateData.category = body.category
    if (body.subCategory !== undefined) updateData.sub_category = body.subCategory
    if (body.subSubCategory !== undefined) updateData.sub_sub_category = body.subSubCategory
    if (body.projectType !== undefined) updateData.project_type = body.projectType
    if (body.projectId !== undefined) updateData.project_id = body.projectId
    if (body.customProject !== undefined) updateData.custom_project = body.customProject
    if (body.summary) updateData.summary = body.summary
    if (body.description !== undefined) updateData.description = body.description
    if (body.startDate) updateData.start_date = body.startDate
    if (body.startTime !== undefined) updateData.start_time = body.startTime
    if (body.endDate) updateData.end_date = body.endDate
    if (body.endTime !== undefined) updateData.end_time = body.endTime
    if (body.location !== undefined) updateData.location = body.location
    if (body.companions !== undefined) updateData.companions = body.companions
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()
    
    if (error) {
      console.error('이벤트 수정 오류:', error)
      return NextResponse.json({ error: '이벤트 수정 실패' }, { status: 500 })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('이벤트 수정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level') || '1'
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: 인증이 필요합니다.' }, { status: 401 })
    }
    
    const supabase = createApiClient()
    
    // 일정 조회 (작성자 확인)
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, created_by_id, participant_id')
      .eq('id', eventId)
      .single()
    
    if (fetchError || !event) {
      console.error('일정 조회 오류:', fetchError)
      return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    // 권한 확인: 본인(작성자 또는 참여자), Level 5, Admin만 삭제 가능
    const isCreator = event.created_by_id === userId
    const isParticipant = event.participant_id === userId
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'
    
    if (!isCreator && !isParticipant && !isLevel5 && !isAdmin) {
      console.log('일정 삭제 권한 없음:', { userId, creatorId: event.created_by_id, participantId: event.participant_id, userLevel })
      return NextResponse.json({ 
        error: 'Forbidden: 본인(작성자/참여자), Level 5, 또는 관리자만 삭제할 수 있습니다.' 
      }, { status: 403 })
    }
    
    // 삭제 실행
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    
    if (error) {
      console.error('이벤트 삭제 오류:', error)
      return NextResponse.json({ error: '이벤트 삭제 실패' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('이벤트 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
