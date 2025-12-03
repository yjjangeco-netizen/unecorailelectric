// 프로젝트 날짜 수정 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixProjectDates() {
  console.log('🔧 프로젝트 날짜 수정 시작...\n')

  try {
    // 1. 모든 프로젝트 조회 (날짜 컬럼 포함)
    console.log('📋 1. 모든 프로젝트 조회 중...')
    const { data: allProjects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (fetchError) {
      console.error('❌ 조회 오류:', fetchError)
      return
    }

    console.log(`✅ ${allProjects?.length || 0}개 프로젝트 발견\n`)

    if (!allProjects || allProjects.length === 0) {
      console.log('⚠️  프로젝트가 없습니다.')
      return
    }

    // 2. 날짜가 잘못된 프로젝트 수정
    console.log('🔧 2. 날짜 필드 초기화 중...\n')
    
    for (const project of allProjects) {
      console.log(`📦 프로젝트: ${project.project_name || project.project_number || project.id}`)
      
      const updates = {
        assembly_date: null,
        factory_test_date: null,
        site_test_date: null,
        completion_date: null
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id)

      if (updateError) {
        console.error(`   ❌ 오류:`, updateError.message)
      } else {
        console.log(`   ✅ 날짜 필드 초기화 완료`)
      }
    }

    // 3. 상위 5개 프로젝트에만 올바른 날짜 추가
    console.log('\n\n📅 3. 올바른 날짜 추가 중...\n')
    
    const schedules = [
      { assembly: '2025-12-10', factory: '2025-12-15', site: '2025-12-20', completion: '2025-12-25' },
      { assembly: '2025-12-12', factory: '2025-12-18', site: '2025-12-23', completion: '2025-12-28' },
      { assembly: '2025-12-08', factory: '2025-12-13', site: '2025-12-19', completion: '2025-12-24' },
      { assembly: '2025-12-14', factory: '2025-12-19', site: '2025-12-24', completion: '2025-12-29' },
      { assembly: '2025-12-16', factory: '2025-12-21', site: '2025-12-26', completion: '2025-12-30' },
    ]

    for (let i = 0; i < Math.min(5, allProjects.length); i++) {
      const project = allProjects[i]
      const schedule = schedules[i]

      console.log(`📦 ${project.project_name || project.project_number}`)
      console.log(`   🟢 조립완료: ${schedule.assembly}`)
      console.log(`   🔵 공장시운전: ${schedule.factory}`)
      console.log(`   🟠 현장시운전: ${schedule.site}`)
      console.log(`   🟣 준공완료: ${schedule.completion}`)

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
        console.error(`   ❌ 오류:`, updateError.message)
      } else {
        console.log(`   ✅ 날짜 추가 완료!\n`)
      }
    }

    // 4. 최종 확인
    console.log('\n\n✅ 4. 최종 확인 중...\n')
    const { data: updatedProjects, error: checkError } = await supabase
      .from('projects')
      .select('id, project_name, project_number, assembly_date, factory_test_date, site_test_date, completion_date')
      .not('assembly_date', 'is', null)
      .order('assembly_date', { ascending: true })

    if (checkError) {
      console.error('❌ 확인 오류:', checkError)
    } else {
      console.log(`✅ 일정이 있는 프로젝트 ${updatedProjects?.length || 0}개 발견!\n`)
      
      updatedProjects?.forEach(p => {
        console.log(`📦 ${p.project_name || p.project_number}`)
        console.log(`   조립: ${p.assembly_date}`)
        console.log(`   공시: ${p.factory_test_date}`)
        console.log(`   현시: ${p.site_test_date}`)
        console.log(`   준공: ${p.completion_date}\n`)
      })
    }

    console.log('\n🎉 완료! 이제 일정 관리 페이지를 새로고침하세요!')

  } catch (error) {
    console.error('❌ 오류:', error)
  }
}

fixProjectDates()

