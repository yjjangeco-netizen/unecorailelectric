// 테스트로 추가한 프로젝트 일정 삭제 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteTestSchedules() {
  console.log('🗑️  테스트 일정 삭제 시작...\n')

  try {
    // 모든 프로젝트의 일정 날짜 필드를 null로 설정
    console.log('📋 프로젝트 일정 삭제 중...')
    
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, project_name, assembly_date, factory_test_date, site_test_date, completion_date')
      .or('assembly_date.not.is.null,factory_test_date.not.is.null,site_test_date.not.is.null,completion_date.not.is.null')

    if (fetchError) {
      console.error('❌ 프로젝트 조회 오류:', fetchError)
      return
    }

    console.log(`✅ 일정이 있는 프로젝트 ${projects?.length || 0}개 발견\n`)

    if (!projects || projects.length === 0) {
      console.log('⚠️  삭제할 일정이 없습니다.')
      return
    }

    // 각 프로젝트의 일정 삭제
    for (const project of projects) {
      console.log(`📦 ${project.project_name}`)
      if (project.assembly_date) console.log(`   🟢 조립완료: ${project.assembly_date} → 삭제`)
      if (project.factory_test_date) console.log(`   🔵 공장시운전: ${project.factory_test_date} → 삭제`)
      if (project.site_test_date) console.log(`   🟠 현장시운전: ${project.site_test_date} → 삭제`)
      if (project.completion_date) console.log(`   🟣 준공완료: ${project.completion_date} → 삭제`)

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          assembly_date: null,
          factory_test_date: null,
          site_test_date: null,
          completion_date: null
        })
        .eq('id', project.id)

      if (updateError) {
        console.error(`   ❌ 삭제 실패:`, updateError.message)
      } else {
        console.log(`   ✅ 삭제 완료!\n`)
      }
    }

    console.log('\n🎉 모든 테스트 일정이 삭제되었습니다!')
    console.log('📅 일정 관리 페이지를 새로고침하세요.')

  } catch (error) {
    console.error('❌ 오류:', error)
  }
}

deleteTestSchedules()

