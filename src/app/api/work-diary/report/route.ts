import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userLevel = request.headers.get('x-user-level')
    const userId = request.headers.get('x-user-id')

    // Level 5 이상만 접근 가능
    if (userLevel !== '5' && userLevel !== 'admin' && userLevel !== 'administrator') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('reportType') || 'project'
    const userIds = searchParams.get('userIds')?.split(',') || []

    if (!startDate || !endDate || userIds.length === 0) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    const supabase = createApiClient()

    // 업무일지 조회
    let query = supabase
      .from('work_diary')
      .select(`
        *,
        projects:project_id (
          id,
          project_name
        )
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .in('user_id', userIds)
      .order('work_date', { ascending: true })

    const { data: workDiaries, error } = await query

    if (error) {
      console.error('업무일지 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 사용자 정보 조회
    const { data: users } = await supabase
      .from('users')
      .select('id, name, department, position')
      .in('id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    // 보고서 타입에 따라 데이터 그룹화
    let groupedData: any = {}

    if (reportType === 'project') {
      // 프로젝트별 그룹화
      workDiaries?.forEach((diary: any) => {
        const projectKey = diary.project_id || 'no-project'
        const projectName = diary.projects?.project_name || diary.custom_project_name || '프로젝트 미지정'
        
        if (!groupedData[projectKey]) {
          groupedData[projectKey] = {
            projectName,
            items: []
          }
        }
        
        groupedData[projectKey].items.push({
          ...diary,
          user: userMap.get(diary.user_id)
        })
      })
    } else if (reportType === 'date') {
      // 날짜별 그룹화
      workDiaries?.forEach((diary: any) => {
        const dateKey = diary.work_date
        
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = {
            date: dateKey,
            items: []
          }
        }
        
        groupedData[dateKey].items.push({
          ...diary,
          user: userMap.get(diary.user_id),
          projectName: diary.projects?.project_name || diary.custom_project_name || '프로젝트 미지정'
        })
      })
    } else if (reportType === 'user') {
      // 사용자별 그룹화
      workDiaries?.forEach((diary: any) => {
        const userKey = diary.user_id
        const user = userMap.get(userKey)
        
        if (!groupedData[userKey]) {
          groupedData[userKey] = {
            userName: user?.name || '알 수 없음',
            department: user?.department,
            position: user?.position,
            items: []
          }
        }
        
        groupedData[userKey].items.push({
          ...diary,
          projectName: diary.projects?.project_name || diary.custom_project_name || '프로젝트 미지정'
        })
      })
    }

    return NextResponse.json({
      success: true,
      reportType,
      period: {
        startDate,
        endDate
      },
      users: Array.from(userMap.values()),
      data: groupedData,
      totalCount: workDiaries?.length || 0
    })

  } catch (error) {
    console.error('보고서 생성 실패:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

