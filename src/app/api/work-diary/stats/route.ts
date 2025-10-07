import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    // 권한 체크를 위한 헤더 확인 (실제 구현에서는 JWT 토큰 등을 사용)
    const authHeader = request.headers.get('authorization')
    const userLevel = request.headers.get('x-user-level')
    const requestUserId = request.headers.get('x-user-id')
    
    // Level 5 이상, administrator, 또는 admin 사용자만 접근 허용
    const isLevel5OrHigher = userLevel && (userLevel === '5' || userLevel === 'administrator' || userLevel === 'Administrator')
    const isAdminUser = requestUserId === 'admin'
    
    if (!isLevel5OrHigher && !isAdminUser) {
      return NextResponse.json({ error: '권한이 없습니다. Level 5 이상만 접근 가능합니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const workType = searchParams.get('workType')
    const workSubType = searchParams.get('workSubType')
    const projectId = searchParams.get('projectId')

    const supabase = createApiClient()

    // 업무일지 데이터 조회 (외래키 조인 없이)
    let query = supabase
      .from('work_diary')
      .select('*')

    // 날짜 필터
    if (startDate) {
      query = query.gte('work_date', startDate)
    }
    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    // 사용자 필터
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId)
    }

    // 작업 유형 필터
    if (workType && workType !== 'all') {
      query = query.eq('work_type', workType)
    }

    // 세부 유형 필터
    if (workSubType && workSubType !== 'all') {
      query = query.eq('work_sub_type', workSubType)
    }

    // 프로젝트 필터
    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', parseInt(projectId))
    }

    const { data: workDiaries, error } = await query

    if (error) {
      console.error('업무일지 조회 실패:', error)
      // 빈 통계 반환 (에러 대신 빈 결과)
      return NextResponse.json({ 
        stats: [
          {
            category: '사용자별 업무 유형 통계',
            value: 0,
            details: []
          },
          {
            category: '주말/휴일 근무 현황',
            value: 0,
            details: []
          },
          {
            category: '프로젝트별 작업량 분석',
            value: 0,
            details: []
          },
          {
            category: '작업 유형별 분포',
            value: 0,
            details: []
          },
          {
            category: '세부 유형별 분포',
            value: 0,
            details: []
          },
          {
            category: '월별 업무 현황',
            value: 0,
            details: []
          }
        ]
      })
    }

    if (!workDiaries || workDiaries.length === 0) {
      console.log('업무일지 데이터가 없습니다.')
      return NextResponse.json({ 
        stats: [
          {
            category: '사용자별 업무 유형 통계',
            value: 0,
            details: []
          },
          {
            category: '주말/휴일 근무 현황',
            value: 0,
            details: []
          },
          {
            category: '프로젝트별 작업량 분석',
            value: 0,
            details: []
          },
          {
            category: '작업 유형별 분포',
            value: 0,
            details: []
          },
          {
            category: '세부 유형별 분포',
            value: 0,
            details: []
          },
          {
            category: '월별 업무 현황',
            value: 0,
            details: []
          }
        ]
      })
    }

    try {
      // 프로젝트 데이터 수동 조회
      const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name, project_number, description')

      // 사용자 데이터 수동 조회
      const { data: users } = await supabase
        .from('users')
        .select('id, name, level, department, position')

      // 데이터 조합
      const enrichedWorkDiaries = workDiaries.map(diary => ({
        ...diary,
        projects: projects?.find(p => p.id === diary.project_id),
        users: users?.find(u => u.id === diary.user_id)
      }))

      // 통계 계산
      const stats = calculateStats(enrichedWorkDiaries)

      return NextResponse.json({ stats })
    } catch (joinError) {
      console.error('데이터 조인 실패:', joinError)
      // 조인 실패 시에도 기본 통계 반환
      const stats = calculateStats(workDiaries)
      return NextResponse.json({ stats })
    }
  } catch (error) {
    console.error('통계 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

function calculateStats(workDiaries: any[]) {
  console.log(`통계 계산 시작: ${workDiaries.length}개의 업무일지 데이터`)
  const stats: any[] = []

  // 1. 사용자별 출장/내근 통계
  const userStats = new Map()
  workDiaries.forEach(diary => {
    const userId = diary.user_id
    const userName = diary.users?.name || 'Unknown'
    const workSubType = diary.work_sub_type || '내근'
    const workHours = diary.work_hours || 0
    const overtimeHours = diary.overtime_hours || 0

    if (!userStats.has(userId)) {
      userStats.set(userId, {
        name: userName,
        출장: 0,
        내근: 0,
        외근: 0,
        전화: 0,
        total: 0,
        totalWorkHours: 0,
        totalOvertimeHours: 0
      })
    }

    const userStat = userStats.get(userId)
    userStat[workSubType] = (userStat[workSubType] || 0) + 1
    userStat.total += 1
    userStat.totalWorkHours += workHours
    userStat.totalOvertimeHours += overtimeHours
  })

  // 사용자별 통계를 카테고리별로 정리
  const userStatsArray = Array.from(userStats.values())
  if (userStatsArray.length > 0) {
    stats.push({
      category: '사용자별 업무 유형 통계',
      value: userStatsArray.length,
      details: userStatsArray.map(user => ({
        name: user.name,
        출장: user.출장,
        내근: user.내근,
        외근: user.외근,
        전화: user.전화,
        total: user.total,
        totalWorkHours: Math.round(user.totalWorkHours * 10) / 10,
        totalOvertimeHours: Math.round(user.totalOvertimeHours * 10) / 10
      }))
    })
  }

  // 2. 주말/휴일 근무 현황
  const weekendWork = workDiaries.filter(diary => {
    const workDate = new Date(diary.work_date)
    const dayOfWeek = workDate.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6 // 일요일(0) 또는 토요일(6)
  })

  if (weekendWork.length > 0) {
    const weekendStats = new Map()
    weekendWork.forEach(diary => {
      const userName = diary.users?.name || 'Unknown'
      const workSubType = diary.work_sub_type || '내근'
      
      if (!weekendStats.has(userName)) {
        weekendStats.set(userName, {
          name: userName,
          count: 0,
          types: {}
        })
      }
      
      const userWeekend = weekendStats.get(userName)
      userWeekend.count += 1
      userWeekend.types[workSubType] = (userWeekend.types[workSubType] || 0) + 1
    })

    stats.push({
      category: '주말/휴일 근무 현황',
      value: weekendWork.length,
      details: Array.from(weekendStats.values()).map(user => ({
        name: user.name,
        count: user.count,
        total: user.count,
        types: user.types
      }))
    })
  }

  // 3. 프로젝트별 작업량 분석
  const projectStats = new Map()
  workDiaries.forEach(diary => {
    const projectId = diary.project_id
    const projectName = diary.projects?.project_name || diary.custom_project_name || '프로젝트 없음'
    const workType = diary.work_type || 'Unknown'
    const workSubType = diary.work_sub_type || '내근'

    if (!projectStats.has(projectId)) {
      projectStats.set(projectId, {
        name: projectName,
        total: 0,
        workTypes: {},
        workSubTypes: {}
      })
    }

    const projectStat = projectStats.get(projectId)
    projectStat.total += 1
    projectStat.workTypes[workType] = (projectStat.workTypes[workType] || 0) + 1
    projectStat.workSubTypes[workSubType] = (projectStat.workSubTypes[workSubType] || 0) + 1
  })

  if (projectStats.size > 0) {
    stats.push({
      category: '프로젝트별 작업량 분석',
      value: projectStats.size,
      details: Array.from(projectStats.values()).map(project => ({
        name: project.name,
        total: project.total,
        count: project.total,
        workTypes: project.workTypes,
        workSubTypes: project.workSubTypes
      }))
    })
  }

  // 4. 작업 유형별 분포
  const workTypeStats = new Map()
  workDiaries.forEach(diary => {
    const workType = diary.work_type || 'Unknown'
    workTypeStats.set(workType, (workTypeStats.get(workType) || 0) + 1)
  })

  if (workTypeStats.size > 0) {
    stats.push({
      category: '작업 유형별 분포',
      value: workDiaries.length,
      details: Array.from(workTypeStats.entries()).map(([type, count]) => ({
        name: type,
        count: count,
        total: count
      }))
    })
  }

  // 5. 세부 유형별 분포
  const workSubTypeStats = new Map()
  workDiaries.forEach(diary => {
    const workSubType = diary.work_sub_type || '내근'
    workSubTypeStats.set(workSubType, (workSubTypeStats.get(workSubType) || 0) + 1)
  })

  if (workSubTypeStats.size > 0) {
    stats.push({
      category: '세부 유형별 분포',
      value: workDiaries.length,
      details: Array.from(workSubTypeStats.entries()).map(([type, count]) => ({
        name: type,
        count: count,
        total: count
      }))
    })
  }

  // 6. 월별 업무 현황
  const monthlyStats = new Map()
  workDiaries.forEach(diary => {
    const workDate = new Date(diary.work_date)
    const monthKey = `${workDate.getFullYear()}-${String(workDate.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyStats.has(monthKey)) {
      monthlyStats.set(monthKey, {
        month: monthKey,
        count: 0,
        users: new Set()
      })
    }
    
    const monthStat = monthlyStats.get(monthKey)
    monthStat.count += 1
    monthStat.users.add(diary.user_id)
  })

  if (monthlyStats.size > 0) {
    stats.push({
      category: '월별 업무 현황',
      value: monthlyStats.size,
      details: Array.from(monthlyStats.values()).map(month => ({
        name: month.month,
        count: month.count,
        total: month.count,
        users: month.users.size
      }))
    })
  }

  // 7. 초과근무 전용 통계
  const overtimeStats = new Map()
  workDiaries.forEach(diary => {
    const overtimeHours = diary.overtime_hours || 0
    if (overtimeHours > 0) {
      const userId = diary.user_id
      const userName = diary.users?.name || 'Unknown'
      const workDate = diary.work_date
      const workSubType = diary.work_sub_type || '내근'
      
      if (!overtimeStats.has(userId)) {
        overtimeStats.set(userId, {
          name: userName,
          totalOvertimeHours: 0,
          overtimeDays: 0,
          details: []
        })
      }
      
      const userOvertime = overtimeStats.get(userId)
      userOvertime.totalOvertimeHours += overtimeHours
      userOvertime.overtimeDays += 1
      userOvertime.details.push({
        date: workDate,
        startTime: diary.start_time || '09:00',
        endTime: diary.end_time || '18:00',
        workHours: diary.work_hours || 0,
        overtimeHours: overtimeHours,
        workType: diary.work_type || '',
        workSubType: workSubType
      })
    }
  })

  const overtimeStatsArray = Array.from(overtimeStats.values())
  if (overtimeStatsArray.length > 0) {
    stats.push({
      category: '초과근무 현황',
      value: overtimeStatsArray.length,
      details: overtimeStatsArray.map(user => ({
        name: user.name,
        totalOvertimeHours: Math.round(user.totalOvertimeHours * 10) / 10,
        overtimeDays: user.overtimeDays,
        details: user.details
      }))
    })
  }

  console.log(`통계 계산 완료: ${stats.length}개 카테고리 생성`)
  console.log('생성된 통계:', stats.map(s => ({ category: s.category, value: s.value, detailsCount: s.details?.length || 0 })))
  
  return stats
}