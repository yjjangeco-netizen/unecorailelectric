// 프로젝트에 조립완료, 공장시운전, 현장시운전 일정 추가 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addProjectSchedules() {
  try {
    console.log('🚀 프로젝트 일정 추가 시작...\n')

    // 1. 모든 프로젝트 조회
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, project_name, project_number')
      .order('created_at', { ascending: false })
      .limit(5)

    if (fetchError) {
      console.error('❌ 프로젝트 조회 실패:', fetchError)
      return
    }

    if (!projects || projects.length === 0) {
      console.log('⚠️  등록된 프로젝트가 없습니다.')
      return
    }

    console.log(`📋 총 ${projects.length}개의 프로젝트 발견\n`)

    // 2. 각 프로젝트에 일정 추가
    const schedules = [
      { assembly: '2025-12-10', factory: '2025-12-15', site: '2025-12-20', completion: '2025-12-25' },
      { assembly: '2025-12-12', factory: '2025-12-18', site: '2025-12-23', completion: '2025-12-28' },
      { assembly: '2025-12-08', factory: '2025-12-13', site: '2025-12-19', completion: '2025-12-24' },
      { assembly: '2025-12-14', factory: '2025-12-19', site: '2025-12-24', completion: '2025-12-29' },
      { assembly: '2025-12-16', factory: '2025-12-21', site: '2025-12-26', completion: '2025-12-30' },
    ]

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      const schedule = schedules[i] || schedules[0]

      console.log(`\n📦 프로젝트: ${project.project_name || project.project_number}`)
      console.log(`   조립완료일: ${schedule.assembly}`)
      console.log(`   공장시운전일: ${schedule.factory}`)
      console.log(`   현장시운전일: ${schedule.site}`)
      console.log(`   준공완료일: ${schedule.completion}`)

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          assembly_date: schedule.assembly,
          factory_test_date: schedule.factory,
          site_test_date: schedule.site,
          completion_date: schedule.completion
        })
        .eq('id', project.id)

      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError.message)
      } else {
        console.log(`   ✅ 일정 추가 완료!`)
      }
    }

    console.log('\n\n🎉 모든 프로젝트 일정 추가 완료!')
    console.log('\n📅 이제 일정 관리 페이지(http://localhost:3001/schedule)를 새로고침하세요!')

  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

// 실행
addProjectSchedules()

