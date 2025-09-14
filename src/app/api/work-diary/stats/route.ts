import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('work_diary')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number
        )
      `)

    // 날짜 필터링
    if (startDate) {
      query = query.gte('work_date', startDate)
    }
    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching work diary stats:', error)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    // 통계 데이터 계산
    const stats = calculateStats(data || [])

    return NextResponse.json({
      success: true,
      data: stats,
      total: data?.length || 0
    })

  } catch (error) {
    console.error('Error in work diary stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStats(data: any[]) {
  // 기본 통계
  const totalEntries = data.length
  const uniqueUsers = new Set(data.map(item => item.user_id)).size
  const uniqueProjects = new Set(
    data.map(item => 
      item.custom_project_name || item.projects?.project_name
    ).filter(Boolean)
  ).size

  // 작업 유형별 통계
  const workTypeStats = data.reduce((acc, item) => {
    const workType = item.work_type || '미분류'
    if (!acc[workType]) {
      acc[workType] = { count: 0, users: new Set(), projects: new Set() }
    }
    acc[workType].count++
    acc[workType].users.add(item.user_id)
    acc[workType].projects.add(
      item.custom_project_name || item.projects?.project_name
    )
    return acc
  }, {})

  // 세부 유형별 통계
  const workSubTypeStats = data.reduce((acc, item) => {
    const workSubType = item.work_sub_type || '미분류'
    if (!acc[workSubType]) {
      acc[workSubType] = { count: 0, users: new Set(), projects: new Set() }
    }
    acc[workSubType].count++
    acc[workSubType].users.add(item.user_id)
    acc[workSubType].projects.add(
      item.custom_project_name || item.projects?.project_name
    )
    return acc
  }, {})

  // 프로젝트별 통계
  const projectStats = data.reduce((acc, item) => {
    const projectName = item.custom_project_name || item.projects?.project_name || '미분류'
    if (!acc[projectName]) {
      acc[projectName] = { 
        count: 0, 
        users: new Set(), 
        workTypes: new Set(),
        workSubTypes: new Set()
      }
    }
    acc[projectName].count++
    acc[projectName].users.add(item.user_id)
    if (item.work_type) acc[projectName].workTypes.add(item.work_type)
    if (item.work_sub_type) acc[projectName].workSubTypes.add(item.work_sub_type)
    return acc
  }, {})

  // 프로젝트 카테고리별 통계 (WSMS/OTHER)
  const projectCategoryStats = data.reduce((acc, item) => {
    const projectNumber = item.projects?.project_number || ''
    const wsmsKeywords = ['cncwl', 'cncuwl', 'wsms', 'm&d', 'tandem', 'cncdwl']
    const hasWsmsKeyword = wsmsKeywords.some(keyword => 
      projectNumber.toLowerCase().includes(keyword.toLowerCase())
    )
    const category = hasWsmsKeyword ? 'WSMS' : 'OTHER'
    
    if (!acc[category]) {
      acc[category] = { 
        count: 0, 
        users: new Set(), 
        projects: new Set(),
        workTypes: new Set(),
        workSubTypes: new Set()
      }
    }
    acc[category].count++
    acc[category].users.add(item.user_id)
    acc[category].projects.add(item.projects?.project_name || 'Unknown')
    if (item.work_type) acc[category].workTypes.add(item.work_type)
    if (item.work_sub_type) acc[category].workSubTypes.add(item.work_sub_type)
    return acc
  }, {})

  // 날짜별 통계
  const dateStats = data.reduce((acc, item) => {
    const date = item.work_date.split('T')[0] // YYYY-MM-DD 형식
    if (!acc[date]) {
      acc[date] = { count: 0, users: new Set(), projects: new Set() }
    }
    acc[date].count++
    acc[date].users.add(item.user_id)
    acc[date].projects.add(
      item.custom_project_name || item.projects?.project_name
    )
    return acc
  }, {})

  // 통계 데이터 정리
  const formatStats = (stats: any) => {
    return Object.entries(stats).map(([key, value]: [string, any]) => ({
      name: key,
      count: value.count,
      uniqueUsers: value.users?.size || 0,
      uniqueProjects: value.projects?.size || 0,
      workTypes: value.workTypes ? Array.from(value.workTypes) : undefined,
      workSubTypes: value.workSubTypes ? Array.from(value.workSubTypes) : undefined
    })).sort((a, b) => b.count - a.count)
  }

  return {
    overview: {
      totalEntries,
      uniqueUsers,
      uniqueProjects,
      dateRange: {
        start: data.length > 0 ? Math.min(...data.map(item => new Date(item.work_date).getTime())) : null,
        end: data.length > 0 ? Math.max(...data.map(item => new Date(item.work_date).getTime())) : null
      }
    },
    workTypeStats: formatStats(workTypeStats),
    workSubTypeStats: formatStats(workSubTypeStats),
    projectStats: formatStats(projectStats),
    projectCategoryStats: formatStats(projectCategoryStats),
    dateStats: Object.entries(dateStats)
      .map(([date, value]: [string, any]) => ({
        date,
        count: value.count,
        uniqueUsers: value.users.size,
        uniqueProjects: value.projects.size
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
