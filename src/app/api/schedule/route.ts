import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Direct Supabase client creation
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 프로젝트 일정 조회
    // assembly_date, factory_test_date, site_test_date, completion_date가 있는 프로젝트 조회
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, project_name, assembly_date, factory_test_date, site_test_date, completion_date, description')
      .or('assembly_date.not.is.null,factory_test_date.not.is.null,site_test_date.not.is.null,completion_date.not.is.null')
    
    console.log('프로젝트 조회 결과:', { 
      count: projects?.length || 0, 
      error: error ? error.message : null,
      sample: projects?.[0] 
    })

    if (error) {
      console.error('프로젝트 일정 조회 오류:', error)
      return NextResponse.json({ error: '프로젝트 일정 조회 실패', details: error.message }, { status: 500 })
    }

    const projectEvents: any[] = []

    projects?.forEach(project => {
      // 조립완료일
      if (project.assembly_date) {
        projectEvents.push({
          id: `assembly-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '조완', // 조립완료
          eventDate: project.assembly_date,
          description: project.description
        })
      }
      // 공장시운전일
      if (project.factory_test_date) {
        projectEvents.push({
          id: `factory-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '공시', // 공장시운전
          eventDate: project.factory_test_date,
          description: project.description
        })
      }
      // 현장시운전일
      if (project.site_test_date) {
        projectEvents.push({
          id: `site-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '현시', // 현장시운전
          eventDate: project.site_test_date,
          description: project.description
        })
      }
      // 준공완료일
      if (project.completion_date) {
        projectEvents.push({
          id: `complete-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '준공', // 준공완료
          eventDate: project.completion_date,
          description: project.description
        })
      }
    })
    
    console.log('생성된 프로젝트 이벤트:', projectEvents.length)
    return NextResponse.json({ projectEvents })
    
  } catch (error) {
    console.error('일정 조회 오류:', error)
    return NextResponse.json({ error: '일정 조회 실패' }, { status: 500 })
  }
}