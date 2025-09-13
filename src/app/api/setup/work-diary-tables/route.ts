import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(_request: NextRequest) {
  try {
    // 1. 기본 프로젝트 데이터 삽입 (테이블이 없으면 자동 생성됨)
    const { error: insertError } = await supabase
      .from('projects')
      .upsert([
        { id: 1, name: '전기설비 유지보수', description: '전기설비 점검 및 유지보수 작업' },
        { id: 2, name: '신규 설치', description: '새로운 전기설비 설치 작업' },
        { id: 3, name: '고장 수리', description: '전기설비 고장 수리 및 복구' },
        { id: 4, name: '점검 작업', description: '정기 점검 및 안전점검' },
        { id: 5, name: '기타 업무', description: '기타 전기 관련 업무' }
      ], { onConflict: 'id' })

    if (insertError) {
      console.error('프로젝트 데이터 삽입 오류:', insertError)
      return NextResponse.json(
        { error: `프로젝트 데이터 삽입 실패: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 2. 샘플 업무일지 데이터 삽입
    const { error: sampleDataError } = await supabase
      .from('work_diary')
      .upsert([
        {
          id: 1,
          user_id: 'user1',
          work_date: '2024-01-15',
          project_id: 1,
          work_content: 'A동 전기실 정기점검 및 배전반 상태 확인'
        },
        {
          id: 2,
          user_id: 'user2',
          work_date: '2024-01-15',
          project_id: 2,
          work_content: 'B동 신규 전기설비 설치 및 배선 작업'
        },
        {
          id: 3,
          user_id: 'user1',
          work_date: '2024-01-14',
          project_id: 3,
          work_content: 'C동 조명 고장 수리 및 교체 작업'
        }
      ], { onConflict: 'id' })

    if (sampleDataError) {
      console.error('샘플 데이터 삽입 오류:', sampleDataError)
      return NextResponse.json(
        { error: `샘플 데이터 삽입 실패: ${sampleDataError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: '업무일지 테이블이 성공적으로 생성되었습니다',
        projects: '프로젝트 데이터 5개 삽입 완료',
        workDiaries: '업무일지 데이터 3개 삽입 완료'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('테이블 생성 오류:', error)
    return NextResponse.json(
      { error: `테이블 생성에 실패했습니다: ${error}` },
      { status: 500 }
    )
  }
}
