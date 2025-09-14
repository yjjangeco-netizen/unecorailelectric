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

// 업무일지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const userLevel = searchParams.get('userLevel')
    const allowedUserIds = searchParams.get('allowedUserIds')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('API 호출 파라미터:', {
      startDate,
      endDate,
      projectId,
      userId,
      userLevel,
      allowedUserIds,
      page,
      limit
    })

    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // RLS가 적용된 쿼리 - 사용자 레벨에 따라 자동 필터링
    let query = supabase
      .from('work_diary')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number,
          description,
          assembly_date,
          factory_test_date,
          site_test_date
        ),
        users:user_id (
          id,
          name,
          level
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 날짜 범위 필터
    if (startDate) {
      query = query.gte('work_date', startDate)
    }
    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    // 프로젝트 필터
    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId)
    }

    // 사용자 필터
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId)
    }

    // 레벨별 권한 제한 적용
    if (allowedUserIds && allowedUserIds !== '') {
      const userIds = allowedUserIds.split(',').filter(id => id.trim() !== '')
      if (userIds.length > 0) {
        query = query.in('user_id', userIds)
        console.log('레벨별 필터링 적용 - 허용된 사용자 ID:', userIds)
      }
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('업무일지 조회 오류:', error)
      return NextResponse.json(
        { error: '업무일지 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 데이터 변환 (프론트엔드 호환성)
    const transformedData = (data || []).map(item => ({
      id: item.id,
      workDate: item.work_date,
      workContent: item.work_content,
      workType: item.work_type,
      workSubType: item.work_sub_type,
      customProjectName: item.custom_project_name,
      projectId: item.project_id,
      userId: item.user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      project: item.projects ? {
        id: item.projects.id,
        projectName: item.projects.project_name,
        projectNumber: item.projects.project_number,
        description: item.projects.description,
        assemblyDate: item.projects.assembly_date,
        factoryTestDate: item.projects.factory_test_date,
        siteTestDate: item.projects.site_test_date
      } : null,
      user: item.users ? {
        id: item.users.id,
        name: item.users.name,
        level: item.users.level
      } : null
    }))

    return NextResponse.json({
      data: transformedData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('업무일지 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 업무일지 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 필수 필드 검증
    if (!body.workContent || !body.workDate) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
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

    // 데이터베이스에 업무일지 생성
    const { data, error } = await supabase
      .from('work_diary')
      .insert({
        user_id: body.userId,
        work_date: body.workDate,
        project_id: body.projectId === 'other' ? null : body.projectId,
        work_content: body.workContent,
        work_type: body.workType || null,
        work_sub_type: body.workSubType || null,
        custom_project_name: body.customProjectName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('업무일지 생성 오류:', error)
      return NextResponse.json(
        { error: '업무일지 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('업무일지 생성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}