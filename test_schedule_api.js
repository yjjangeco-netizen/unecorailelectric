// 일정 API 테스트 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testScheduleAPI() {
  console.log('🔍 일정 API 테스트 시작...\n')

  try {
    // 1. 프로젝트에서 일정이 있는 데이터 조회
    console.log('📋 1. 프로젝트 일정 조회 중...')
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name, project_number, assembly_date, factory_test_date, site_test_date, completion_date, description')
      .or('assembly_date.neq.null,factory_test_date.neq.null,site_test_date.neq.null,completion_date.neq.null')

    if (projectError) {
      console.error('❌ 프로젝트 조회 오류:', projectError)
    } else {
      console.log(`✅ 프로젝트 ${projects?.length || 0}개 발견\n`)
      
      if (projects && projects.length > 0) {
        projects.forEach(project => {
          console.log(`📦 ${project.project_name || project.project_number}`)
          if (project.assembly_date) console.log(`   🟢 조립완료: ${project.assembly_date}`)
          if (project.factory_test_date) console.log(`   🔵 공장시운전: ${project.factory_test_date}`)
          if (project.site_test_date) console.log(`   🟠 현장시운전: ${project.site_test_date}`)
          if (project.completion_date) console.log(`   🟣 준공완료: ${project.completion_date}`)
          console.log('')
        })
      }
    }

    // 2. 변환된 이벤트 형식으로 확인
    console.log('\n📅 2. 달력 이벤트 형식으로 변환...')
    const projectEvents = []
    
    projects?.forEach(project => {
      if (project.assembly_date) {
        projectEvents.push({
          id: `assembly-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '조완',
          eventDate: project.assembly_date,
          description: project.description
        })
      }
      if (project.factory_test_date) {
        projectEvents.push({
          id: `factory-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '공시',
          eventDate: project.factory_test_date,
          description: project.description
        })
      }
      if (project.site_test_date) {
        projectEvents.push({
          id: `site-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '현시',
          eventDate: project.site_test_date,
          description: project.description
        })
      }
      if (project.completion_date) {
        projectEvents.push({
          id: `complete-${project.id}`,
          project: { projectName: project.project_name },
          eventType: '준공',
          eventDate: project.completion_date,
          description: project.description
        })
      }
    })

    console.log(`✅ 총 ${projectEvents.length}개의 일정 이벤트 생성됨\n`)
    
    projectEvents.forEach(event => {
      console.log(`  [${event.eventType}] ${event.project.projectName} - ${event.eventDate}`)
    })

  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

testScheduleAPI()

