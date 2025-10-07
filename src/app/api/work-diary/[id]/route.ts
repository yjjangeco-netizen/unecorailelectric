import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 업무일지 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient()
    const { id } = params

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