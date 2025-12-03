import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const supabase = createApiClient()
    
    // 프로젝트 일정 조회
    // assembly_date, factory_test_date, site_test_date, completion_date가 있는 프로젝트 조회
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, project_name, assembly_date, factory_test_date, site_test_date, completion_date, description')
      .or('assembly_date.neq.null,factory_test_date.neq.null,site_test_date.neq.null,completion_date.neq.null')
    
    if (error) {
      console.error('프로젝트 일정 조회 오류:', error)
      return NextResponse.json({ error: '프로젝트 일정 조회 실패' }, { status: 500 })
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
    
    return NextResponse.json({ projectEvents })
    
  } catch (error) {
    console.error('일정 조회 오류:', error)
    return NextResponse.json({ error: '일정 조회 실패' }, { status: 500 })
  }
}