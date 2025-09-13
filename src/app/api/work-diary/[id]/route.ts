import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 작업유형/세부유형 검증 함수
async function validateWorkTypeAndSubType(body: any): Promise<string | null> {
  try {
    // 프로젝트번호 확인
    let projectNumber = ''
    
    if (body.customProjectName) {
      // 기타 프로젝트의 경우 프로젝트명에서 키워드 검색
      projectNumber = body.customProjectName
    } else if (body.projectId && body.projectId !== 'other') {
      const { data: project } = await supabase
        .from('projects')
        .select('project_number')
        .eq('id', body.projectId)
        .single()
      
      if (project) {
        projectNumber = project.project_number
      }
    }

    // WSMS 관련 프로젝트 키워드 확인 (프로젝트번호 기준)
    const wsmsKeywords = ['cncwl', 'cncuwl', 'wsms', 'm&d', 'tandem', 'cncdwl']
    const hasWsmsKeyword = wsmsKeywords.some(keyword => 
      projectNumber.toLowerCase().includes(keyword.toLowerCase())
    )

    if (hasWsmsKeyword) {
      // WSMS 관련 프로젝트인 경우 작업유형 검증
      const validWorkTypes = ['신규', '보완', 'AS', 'SS', 'OV']
      if (body.workType && !validWorkTypes.includes(body.workType)) {
        return `WSMS 관련 프로젝트는 다음 작업유형만 허용됩니다: ${validWorkTypes.join(', ')}`
      }

      // 작업유형이 선택된 경우 세부유형 검증
      if (body.workType && body.workType !== '') {
        const validWorkSubTypes = ['출장', '외근', '전화']
        if (body.workSubType && !validWorkSubTypes.includes(body.workSubType)) {
          return `WSMS 관련 프로젝트는 다음 세부유형만 허용됩니다: ${validWorkSubTypes.join(', ')}`
        }
      }
    }

    return null
  } catch (error) {
    console.error('작업유형/세부유형 검증 오류:', error)
    return '작업유형/세부유형 검증 중 오류가 발생했습니다'
  }
}

// 업무일지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const diaryId = params.id

    if (!diaryId) {
      return NextResponse.json(
        { error: '업무일지 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 데이터베이스에서 업무일지 삭제
    const { error } = await supabase
      .from('work_diary')
      .delete()
      .eq('id', diaryId)

    if (error) {
      console.error('업무일지 삭제 오류:', error)
      return NextResponse.json(
        { error: '업무일지 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: '업무일지가 성공적으로 삭제되었습니다' },
      { status: 200 }
    )
  } catch (error) {
    console.error('업무일지 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
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
    const diaryId = params.id
    const body = await request.json()

    if (!diaryId) {
      return NextResponse.json(
        { error: '업무일지 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 작업유형/세부유형 검증
    const validationError = await validateWorkTypeAndSubType(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // 데이터베이스에서 업무일지 수정
    const { error } = await supabase
      .from('work_diary')
      .update({
        work_content: body.workContent,
        project_id: body.projectId,
        work_date: body.workDate,
        work_type: body.workType || null,
        work_sub_type: body.workSubType || null,
        custom_project_name: body.customProjectName || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', diaryId)

    if (error) {
      console.error('업무일지 수정 오류:', error)
      return NextResponse.json(
        { error: '업무일지 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: '업무일지가 성공적으로 수정되었습니다' },
      { status: 200 }
    )
  } catch (error) {
    console.error('업무일지 수정 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 업무일지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const diaryId = params.id

    if (!diaryId) {
      return NextResponse.json(
        { error: '업무일지 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 데이터베이스에서 업무일지 조회
    const { data, error } = await supabase
      .from('work_diary')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          description
        )
      `)
      .eq('id', diaryId)
      .single()

    if (error) {
      console.error('업무일지 조회 오류:', error)
      return NextResponse.json(
        { error: '업무일지 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('업무일지 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
