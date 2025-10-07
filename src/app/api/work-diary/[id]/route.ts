import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 업무일지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient()
    const { id } = params

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
      console.log('업무일지 삭제 권한 없음:', { userId, diaryUserId: diary.user_id, userLevel })
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
    const supabase = createApiClient()
    const { id } = params
    const body = await request.json()

    const { data, error } = await supabase
      .from('work_diary')
      .update({
        work_content: body.workContent,
        work_type: body.workType || null,
        work_sub_type: body.workSubType || null,
        custom_project_name: body.customProjectName || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('업무일지 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: '업무일지가 성공적으로 수정되었습니다.', data: data?.[0] },
      { status: 200 }
    )
  } catch (error) {
    console.error('업무일지 수정 중 오류 발생:', error)
    return NextResponse.json(
      { error: '업무일지 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}