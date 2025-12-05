import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 단일 업무일지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`[GET] Fetching Work Diary ID: ${id}`)

    const supabase = supabaseServer

    const { data, error } = await supabase
      .from('work_diary')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error(`[GET] 업무일지 조회 실패:`, error)
      return NextResponse.json({ error: '업무일지를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[GET] 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// 업무일지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`[DELETE] Work Diary ID: ${id}`)

    const supabase = supabaseServer

    // 헤더에서 사용자 정보 확인
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: 인증이 필요합니다.' }, { status: 401 })
    }

    // 업무일지 조회 (작성자 확인)
    const { data: diary, error: fetchError } = await supabase
      .from('work_diary')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !diary) {
      console.error('업무일지 조회 오류:', fetchError)
      return NextResponse.json({ error: '업무일지를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인: 본인, Level 5, Admin만 삭제 가능
    const isOwner = diary.user_id === userId
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'

    if (!isOwner && !isLevel5 && !isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden: 본인, Level 5, 또는 관리자만 삭제할 수 있습니다.' 
      }, { status: 403 })
    }

    // 삭제 실행
    const { error } = await supabase
      .from('work_diary')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('업무일지 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: '업무일지가 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('업무일지 삭제 중 오류 발생:', error)
    return NextResponse.json(
      { error: '업무일지 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 업무일지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    console.log(`[PUT] Update Work Diary ID: ${id}`)
    console.log(`[PUT] Body:`, JSON.stringify(body))

    const supabase = supabaseServer

    // 헤더에서 사용자 정보 확인
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'
    const canManage = isLevel5 || isAdmin

    // 현재 상태 조회
    console.log(`[PUT] Querying work_diary with id: ${id}`)
    
    const { data: currentDiary, error: fetchError } = await supabase
      .from('work_diary')
      .select('*')
      .eq('id', id)
      .single()

    console.log(`[PUT] Query result:`, currentDiary ? 'Found' : 'Not Found', fetchError)

    if (fetchError || !currentDiary) {
      console.error(`[PUT] 업무일지 조회 실패:`, fetchError)
      return NextResponse.json({ error: '업무일지를 찾을 수 없습니다.', id, fetchError }, { status: 404 })
    }

    // 권한 확인 (본인 또는 관리자)
    if (currentDiary.user_id !== userId && !canManage) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    // 업데이트할 데이터 객체 생성
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // 확정 상태 변경
    if (body.isConfirmed !== undefined) {
      if (!canManage) {
        return NextResponse.json({ error: '확정 상태를 변경할 권한이 없습니다.' }, { status: 403 })
      }
      updateData.is_confirmed = body.isConfirmed
    }

    // 승인 상태 변경
    if (body.approvalStatus !== undefined) {
      if (!canManage) {
        return NextResponse.json({ error: '승인 상태를 변경할 권한이 없습니다.' }, { status: 403 })
      }
      updateData.approval_status = body.approvalStatus
    }

    // 관리자 코멘트 변경
    if (body.adminComment !== undefined) {
      if (!canManage) {
        return NextResponse.json({ error: '코멘트를 작성할 권한이 없습니다.' }, { status: 403 })
      }
      updateData.admin_comment = body.adminComment
    }

    // 내용 수정
    if (body.workContent) updateData.work_content = body.workContent
    if (body.workType !== undefined) updateData.work_type = body.workType || null
    if (body.workSubType !== undefined) updateData.work_sub_type = body.workSubType || null
    if (body.customProjectName !== undefined) updateData.custom_project_name = body.customProjectName || null
    if (body.workDate !== undefined) updateData.work_date = body.workDate
    if (body.projectId !== undefined) updateData.project_id = body.projectId || null
    if (body.workHours !== undefined) updateData.work_hours = body.workHours

    console.log(`[PUT] Update data:`, JSON.stringify(updateData))

    const { data, error } = await supabase
      .from('work_diary')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('업무일지 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[PUT] Update success:`, data)

    return NextResponse.json(
      { message: '업무일지가 성공적으로 수정되었습니다.', data: data?.[0] },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('업무일지 수정 중 오류 발생:', error)
    return NextResponse.json(
      { 
        error: '업무일지 수정 중 오류가 발생했습니다.',
        details: error?.message || String(error),
        stack: error?.stack
      },
      { status: 500 }
    )
  }
}
