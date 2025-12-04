import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 업무일지 목록 조회 - 프로젝트 및 사용자 정보 포함
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const userLevel = searchParams.get('userLevel')
    const allowedUserIds = searchParams.get('allowedUserIds')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('🔍 업무일지 조회 요청:', {
      startDate,
      endDate,
      projectId,
      userId,
      userLevel,
      allowedUserIds,
      page,
      limit
    })

    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Step 1: work_diary 기본 조회 (조인 없이)
    let query = supabase
      .from('work_diary')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 날짜 범위 필터
    if (startDate) query = query.gte('work_date', startDate)
    if (endDate) query = query.lte('work_date', endDate)

    // 프로젝트 필터
    if (projectId && projectId !== 'all') query = query.eq('project_id', projectId)

    // 사용자 필터
    // Level 5 또는 Admin은 모든 사용자의 데이터를 볼 수 있음
    // 단, userId 파라미터가 명시적으로 제공되면 해당 사용자로 필터링
    const isAdminOrLevel5 = userLevel === '5' || userLevel?.toLowerCase() === 'administrator'
    
    if (userId && userId !== 'all') {
      // 특정 사용자 필터링 요청이 있는 경우
      query = query.eq('user_id', userId)
    } else if (!isAdminOrLevel5) {
      // 일반 사용자는 자신의 데이터만 볼 수 있음 (userId가 없거나 all일 때)
      // 여기서 userId는 요청 헤더나 세션에서 가져온 현재 로그인한 사용자의 ID여야 함
      // 현재 클라이언트에서 userId를 쿼리 파라미터로 보내주고 있다고 가정
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        // 안전을 위해 userId가 없으면 빈 결과 반환하거나 에러 처리
        // 여기서는 빈 결과 반환
        return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
      }
    }

    // 레벨별 권한 제한 (allowedUserIds)
    if (allowedUserIds && allowedUserIds !== '') {
      const userIds = allowedUserIds.split(',').filter(id => id.trim() !== '')
      if (userIds.length > 0) {
        query = query.in('user_id', userIds)
        console.log('✅ 레벨별 필터링 적용:', userIds)
      }
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: workDiaries, error, count } = await query

    if (error) {
      console.error('❌ 업무일지 조회 오류:', error)
      return NextResponse.json(
        { error: '업무일지 조회에 실패했습니다', details: error },
        { status: 500 }
      )
    }

    if (!workDiaries || workDiaries.length === 0) {
      console.log('⚠️  조회된 업무일지 없음')
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      })
    }

    console.log(`📋 ${workDiaries.length}개 업무일지 조회됨`)

    // Step 2: 프로젝트 정보 조회 (중복 제거)
    const projectIds = [...new Set(
      workDiaries
        .map(d => d.project_id)
        .filter(id => id !== null && id !== undefined)
    )]

    let projectsMap = new Map()
    if (projectIds.length > 0) {
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, project_number, project_name, description')
        .in('id', projectIds)

      if (projectError) {
        console.error('⚠️  프로젝트 조회 오류:', projectError)
      } else if (projects) {
        projects.forEach(p => {
          projectsMap.set(p.id, {
            id: p.id,
            projectNumber: p.project_number || '',
            projectName: p.project_name || '',
            description: p.description || ''
          })
        })
        console.log(`✅ ${projects.length}개 프로젝트 정보 조회됨`)
      }
    }

    // Step 3: 사용자 정보 조회 (중복 제거)
    const userIds = [...new Set(
      workDiaries
        .map(d => d.user_id)
        .filter(id => id !== null && id !== undefined)
    )]

    let usersMap = new Map()
    if (userIds.length > 0) {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, level, department, position')
        .in('id', userIds)

      if (userError) {
        console.error('⚠️  사용자 조회 오류:', userError)
      } else if (users) {
        users.forEach(u => {
          usersMap.set(u.id, {
            id: u.id,
            name: u.name || '알 수 없음',
            level: u.level || 'user',
            department: u.department || '',
            position: u.position || ''
          })
        })
        console.log(`✅ ${users.length}명 사용자 정보 조회됨`)
      }
    }

    // Step 4: 데이터 결합 및 변환
    const transformedData = workDiaries.map(diary => {
      const project = diary.project_id ? projectsMap.get(diary.project_id) : null
      const user = diary.user_id ? usersMap.get(diary.user_id) : null

      return {
        id: diary.id,
        workDate: diary.work_date,
        workContent: diary.work_content,
        workType: diary.work_type || '',
        workSubType: diary.work_sub_type || '',
        customProjectName: diary.custom_project_name || '',
        projectId: diary.project_id,
        userId: diary.user_id,
        createdAt: diary.created_at,
        updatedAt: diary.updated_at,
        isConfirmed: diary.is_confirmed || false,
        adminComment: diary.admin_comment || '',
        
        // 프로젝트 정보 (통계용)
        project: project ? {
          id: project.id,
          project_number: project.projectNumber,
          project_name: project.projectName,
          description: project.description
        } : null,
        
        // 사용자 정보 (통계용)
        user: user ? {
          id: user.id,
          name: user.name,
          level: user.level,
          department: user.department,
          position: user.position
        } : null
      }
    })

    console.log(`✅ ${transformedData.length}개 업무일지 반환 (프로젝트 및 사용자 정보 포함)`)

    return NextResponse.json({
      data: transformedData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('❌ 업무일지 조회 중 오류:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 업무일지 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📝 업무일지 생성 요청:', body)

    // 필수 필드 검증
    if (!body.workContent || !body.workDate || !body.userId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다 (workContent, workDate, userId)' },
        { status: 400 }
      )
    }

    // 작업 유형 검증 (프론트엔드와 일치)
    const validWorkTypes = ['신규', '보완', 'AS', 'SS', 'OV', '기타']
    const validWorkSubTypes = ['내근', '출장', '외근', '전화', ''] // 빈 문자열 허용
    
    if (body.workType && !validWorkTypes.includes(body.workType)) {
      return NextResponse.json(
        { error: `작업 유형은 ${validWorkTypes.join(', ')} 중 하나여야 합니다. 받은 값: ${body.workType}` },
        { status: 400 }
      )
    }
    
    if (body.workSubType && !validWorkSubTypes.includes(body.workSubType)) {
      return NextResponse.json(
        { error: `작업 세부 유형은 ${validWorkSubTypes.filter(t => t).join(', ')} 중 하나여야 합니다. 받은 값: ${body.workSubType}` },
        { status: 400 }
      )
    }

    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 프로젝트 ID 처리
    let finalProjectId = null
    if (body.projectId && body.projectId !== 'other' && body.projectId !== '') {
      finalProjectId = parseInt(body.projectId)
      
      // 프로젝트 존재 여부 확인
      const { data: projectExists } = await supabase
        .from('projects')
        .select('id')
        .eq('id', finalProjectId)
        .single()
      
      if (!projectExists) {
        console.warn(`⚠️  프로젝트 ID ${finalProjectId}가 존재하지 않음`)
        finalProjectId = null
      }
    }

    // 사용자 존재 여부 확인
    console.log(`🔍 사용자 ID 확인 중: ${body.userId} (타입: ${typeof body.userId})`)
    
    const { data: userExists, error: userCheckError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', body.userId)
      .maybeSingle()
    
    if (userCheckError) {
      console.error('❌ 사용자 조회 오류:', userCheckError)
    }
    
    console.log(`✅ 사용자 확인 결과:`, userExists)
    
    if (!userExists) {
      // 사용가능한 사용자 ID 목록 조회 (디버깅용)
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name')
        .limit(10)
      
      console.log('📋 사용 가능한 사용자 ID (샘플):', allUsers)
      
      return NextResponse.json(
        { 
          error: `사용자 ID "${body.userId}" (타입: ${typeof body.userId})가 존재하지 않습니다`,
          availableUserIds: allUsers?.map(u => `${u.id} (${u.name})`)
        },
        { status: 400 }
      )
    }

    // 근무시간 계산 함수 (퇴근시간 - 출근시간 - 1시간)
    const calculateWorkHours = (startTime: string, endTime: string): number => {
      if (!startTime || !endTime) return 0
      
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)
      
      // 퇴근시간이 출근시간보다 이른 경우 (다음날까지 일한 경우)
      if (end < start) {
        end.setDate(end.getDate() + 1)
      }
      
      const diffMs = end.getTime() - start.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      // 점심시간 1시간 제외
      const workHours = Math.max(0, diffHours - 1)
      
      return Math.round(workHours * 10) / 10 // 소수점 첫째자리까지
    }

    // 초과근무시간 계산 함수 (정규 근무시간 8시간 초과 시)
    const calculateOvertimeHours = (workHours: number): number => {
      const regularHours = 8
      return Math.max(0, workHours - regularHours)
    }

    // 근무시간: 클라이언트에서 전달된 값 우선 사용, 없으면 자동 계산
    const workHours = body.workHours != null && body.workHours > 0 
      ? body.workHours 
      : (body.startTime && body.endTime ? calculateWorkHours(body.startTime, body.endTime) : 0)
    const overtimeHours = calculateOvertimeHours(workHours)

    // 데이터베이스에 업무일지 생성
    const insertData = {
      user_id: body.userId,
      work_date: body.workDate,
      project_id: finalProjectId,
      work_content: body.workContent,
      work_type: body.workType || null,
      work_sub_type: body.workSubType || null,
      custom_project_name: body.customProjectName || null,
      start_time: body.startTime || null,
      end_time: body.endTime || null,
      work_hours: workHours,
      overtime_hours: overtimeHours,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 삽입할 데이터:', insertData)

    const { data, error } = await supabase
      .from('work_diary')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ 업무일지 생성 오류:', error)
      return NextResponse.json(
        { error: '업무일지 생성에 실패했습니다', details: error },
        { status: 500 }
      )
    }

    console.log('✅ 업무일지 생성 성공:', data)

    return NextResponse.json({
      message: '업무일지가 성공적으로 생성되었습니다',
      data
    }, { status: 201 })
  } catch (error) {
    console.error('❌ 업무일지 생성 중 오류:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
