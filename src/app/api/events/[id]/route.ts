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
    const userLevel = request.headers.get('x-user-level') || '1'
    
    const supabase = createApiClient()
    
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
