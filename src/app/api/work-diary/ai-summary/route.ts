import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userLevel = request.headers.get('x-user-level')
    const userId = request.headers.get('x-user-id')

    // Level 5 이상만 접근 가능
    if (userLevel !== '5' && userLevel !== 'admin' && userLevel !== 'administrator') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userIds = searchParams.get('userIds')?.split(',') || []

    if (!startDate || !endDate || userIds.length === 0) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    const supabase = createApiClient()

    // 업무일지 조회
    const { data: workDiaries, error } = await supabase
      .from('work_diary')
      .select(`
        *,
        projects:project_id (
          id,
          project_name
        )
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .in('user_id', userIds)
      .order('work_date', { ascending: true })

    if (error) {
      console.error('업무일지 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 사용자 정보 조회
    const { data: users } = await supabase
      .from('users')
      .select('id, name, department, position')
      .in('id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    // AI 분석을 위한 데이터 정리
    const analysisData = workDiaries?.map((diary: any) => ({
      date: diary.work_date,
      user: userMap.get(diary.user_id)?.name || '알 수 없음',
      department: userMap.get(diary.user_id)?.department || '',
      position: userMap.get(diary.user_id)?.position || '',
      project: diary.projects?.project_name || diary.custom_project_name || '프로젝트 미지정',
      workType: diary.work_type || '',
      workSubType: diary.work_sub_type || '',
      workContent: diary.work_content,
      workHours: diary.work_hours || 8,
      overtimeHours: diary.overtime_hours || 0
    })) || []

    // Google Gemini AI로 분석
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY가 설정되지 않았습니다.')
      return NextResponse.json({ 
        error: 'AI 서비스 설정 오류', 
        details: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' 
      }, { status: 500 })
    }

    if (analysisData.length === 0) {
      return NextResponse.json({
        success: true,
        period: { startDate, endDate },
        totalEntries: 0,
        users: Array.from(userMap.values()),
        analysis: '<p>선택한 기간에 해당 사용자의 업무일지 데이터가 없습니다.</p>',
        rawData: []
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
다음은 ${startDate}부터 ${endDate}까지의 업무일지 데이터입니다.
이 데이터를 분석하여 상세한 보고서를 작성해주세요.

업무일지 데이터:
${JSON.stringify(analysisData, null, 2)}

다음 항목을 포함하여 HTML 형식으로 분석 보고서를 작성해주세요:

1. **📊 업무 개요**
   - 총 업무 일수
   - 참여 인원
   - 주요 프로젝트

2. **⏰ 시간 분석**
   - 총 투입 시간 (정규 + 초과근무)
   - 일평균 근무 시간
   - 초과근무 비율
   - 시간 분포 분석

3. **📈 업무 난이도 평가**
   - 업무 유형별 복잡도
   - 예상 난이도 (상/중/하)
   - 난이도가 높은 업무 식별

4. **💡 업무 패턴 분석**
   - 주요 업무 유형
   - 반복 업무 vs 신규 업무
   - 프로젝트별 시간 배분

5. **🎯 개선 제안**
   - 업무 효율화 방안
   - 시간 관리 개선점
   - 협업 개선 방안
   - 추가 교육/지원 필요 사항

6. **📝 종합 평가**
   - 전반적인 업무 수행 평가
   - 강점
   - 개선 필요 영역

응답은 반드시 HTML 형식으로 작성하고, 각 섹션을 구분하여 가독성을 높여주세요.
한글로 작성하고, 구체적인 수치와 예시를 포함해주세요.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysis = response.text()

    return NextResponse.json({
      success: true,
      period: {
        startDate,
        endDate
      },
      totalEntries: workDiaries?.length || 0,
      users: Array.from(userMap.values()),
      analysis: analysis.replace(/```html|```/g, '').trim(),
      rawData: analysisData
    })

  } catch (error) {
    console.error('AI 분석 실패:', error)
    return NextResponse.json({ 
      error: 'AI 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

