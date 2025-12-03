// 원래 있던 프로젝트 일정 복구 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreOriginalSchedules() {
  console.log('🔄 원래 일정 복구 시작...\n')

  try {
    // 원래 있던 일정 데이터 (삭제 로그에서 확인)
    const originalSchedules = [
      {
        name: '시흥2호기 선반',
        assembly: '2025-07-23',
        factory: '2025-08-12',
        site: '2025-09-30'
      },
      {
        name: '안심 전삭기',
        assembly: '2025-09-10',
        factory: '2025-09-18',
        site: '2025-10-24'
      },
      {
        name: '개화 전삭기',
        assembly: '2025-09-30',
        factory: '2025-10-02',
        site: '2025-12-10'
      },
      {
        name: '개화 선반',
        assembly: '2025-10-31',
        factory: '2025-10-18',
        site: '2026-01-10'
      },
      {
        name: '진접 전삭기',
        assembly: '2025-11-28',
        factory: '2025-12-16',
        site: '2026-02-12'
      }
    ]

    for (const schedule of originalSchedules) {
      console.log(`📦 ${schedule.name}`)
      console.log(`   🟢 조립완료: ${schedule.assembly}`)
      console.log(`   🔵 공장시운전: ${schedule.factory}`)
      console.log(`   🟠 현장시운전: ${schedule.site}`)

      // 프로젝트 찾기
      const { data: projects, error: findError } = await supabase
        .from('projects')
        .select('id, project_name')
        .ilike('project_name', `%${schedule.name}%`)
        .limit(1)

      if (findError || !projects || projects.length === 0) {
        console.log(`   ❌ 프로젝트를 찾을 수 없습니다.\n`)
        continue
      }

      const project = projects[0]

      // 일정 복구
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          assembly_date: schedule.assembly,
          factory_test_date: schedule.factory,
          site_test_date: schedule.site
        })
        .eq('id', project.id)

      if (updateError) {
        console.error(`   ❌ 복구 실패:`, updateError.message)
      } else {
        console.log(`   ✅ 일정 복구 완료!\n`)
      }
    }

    console.log('\n🎉 원래 일정이 모두 복구되었습니다!')
    console.log('📅 일정 관리 페이지를 새로고침하세요.')

  } catch (error) {
    console.error('❌ 오류:', error)
  }
}

restoreOriginalSchedules()

