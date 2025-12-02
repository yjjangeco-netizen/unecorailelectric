import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

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
    const { id } = params
    const body = await request.json()

    console.log(`[PUT] Update Work Diary ID: ${id}`)
    console.log(`[PUT] Body:`, body)
    console.log(`[PUT] Headers: x-user-id=${request.headers.get('x-user-id')}, x-user-level=${request.headers.get('x-user-level')}`)

    // Try to use service role key if available, otherwise fall back to anon
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    let supabase
    if (supabaseServiceKey) {
      console.log('Using Service Role Key for Admin Action')
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    } else {
      console.log('Using Anon Key (Service Role Key not found)')
      supabase = createApiClient()
    }



    // 헤더에서 사용자 정보 확인
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'
    const canManage = isLevel5 || isAdmin

    // 현재 상태 조회
    const { data: currentDiary, error: fetchError } = await supabase
      .from('work_diary')
      .select('is_confirmed, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !currentDiary) {
      return NextResponse.json({ error: '업무일지를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인 (본인 또는 관리자)
    if (currentDiary.user_id !== userId && !canManage) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    // 업데이트할 데이터 객체 생성
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // 1. 확정 상태 변경 (관리자만 가능)
    if (body.isConfirmed !== undefined) {
      if (!canManage) {
        return NextResponse.json({ error: '확정 상태를 변경할 권한이 없습니다.' }, { status: 403 })
      }
      updateData.is_confirmed = body.isConfirmed
    }

    // 2. 관리자 코멘트 변경 (관리자만 가능)
    if (body.adminComment !== undefined) {
      if (!canManage) {
        return NextResponse.json({ error: '코멘트를 작성할 권한이 없습니다.' }, { status: 403 })
      }
      updateData.admin_comment = body.adminComment
    }

    // 3. 내용 수정 (확정된 경우 수정 불가)
    // 단, 관리자가 확정을 취소하는 경우(isConfirmed: false)는 제외
    const isUnlocking = body.isConfirmed === false
    const isContentUpdate = body.workContent || body.workType || body.workSubType || body.customProjectName

    if (currentDiary.is_confirmed && !isUnlocking && isContentUpdate) {
       // 관리자라도 확정된 상태에서는 내용 수정 불가 (먼저 확정 취소해야 함)
       return NextResponse.json({ error: '확정된 업무일지는 수정할 수 없습니다. 관리자에게 문의하여 확정을 취소하세요.' }, { status: 400 })
    }

    if (body.workContent) updateData.work_content = body.workContent
    if (body.workType !== undefined) updateData.work_type = body.workType || null
    if (body.workSubType !== undefined) updateData.work_sub_type = body.workSubType || null
    if (body.customProjectName !== undefined) updateData.custom_project_name = body.customProjectName || null

    const { data, error } = await supabase
      .from('work_diary')
      .update(updateData)
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