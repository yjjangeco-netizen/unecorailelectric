import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, userId } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '시작일과 종료일은 필수입니다.' },
        { status: 400 }
      )
    }

    // Supabase Setup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch Work Diaries
    let query = supabase
      .from('work_diary')
      .select(`
        *,
        projects (project_name),
        users (name, department, position)
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: true })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: diaries, error } = await query

    if (error) {
      console.error('Error fetching work diaries:', error)
      return NextResponse.json({ error: '업무일지 조회 실패' }, { status: 500 })
    }

    if (!diaries || diaries.length === 0) {
      return NextResponse.json({ summary: '해당 기간에 작성된 업무일지가 없습니다.' })
    }

    // Format Data for Prompt
    const formattedDiaries = diaries.map((d: any) => {
      const date = d.work_date
      const user = d.users ? `${d.users.name} (${d.users.position})` : 'Unknown'
      const project = d.projects?.project_name || d.custom_project_name || '기타'
      const type = d.work_type || ''
      const subType = d.work_sub_type || ''
      const content = d.work_content
      return `[${date}] ${user} - 프로젝트: ${project} (${type}/${subType})\n내용: ${content}`
    }).join('\n\n')

    // Gemini Setup
    // Note: In a real app, use a server-side environment variable for the API key.
    // For this environment, we might need to ask the user for a key or use a placeholder if not set.
    // Assuming NEXT_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY is available.
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
다음은 ${startDate}부터 ${endDate}까지의 업무일지 기록입니다.
이 내용을 바탕으로 다음 항목에 맞춰 주간 업무 요약 보고서를 작성해 주세요.
한국어로 작성해 주세요.

[업무일지 데이터]
${formattedDiaries}

[보고서 양식]
## 주간 업무 요약 보고서 (${startDate} ~ ${endDate})

### 1. 주요 진행 프로젝트 및 성과
- (프로젝트별로 주요 진행 상황을 요약)

### 2. 주요 이슈 및 해결 사항
- (발생한 이슈나 특이사항, 해결된 내용)

### 3. 부서/팀원별 주요 활동
- (팀원별 또는 부서별 주요 활동 요약)

### 4. 차주 예정 사항 (추론 가능할 경우)
- (업무 내용을 바탕으로 다음 주에 진행될 것으로 예상되는 업무)
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ summary: text })

  } catch (error) {
    console.error('AI Summarization Error:', error)
    return NextResponse.json(
      { error: 'AI 요약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
