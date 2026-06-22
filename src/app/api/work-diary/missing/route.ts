import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isHoliday } from '@/lib/holidays'

export const dynamic = 'force-dynamic'

const KST_TIME_ZONE = 'Asia/Seoul'

function formatKstDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function dateStringToUtcDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function addDaysToDateString(date: string, days: number) {
  const next = dateStringToUtcDate(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

function isWeekendDate(date: string) {
  const day = dateStringToUtcDate(date).getUTCDay()
  return day === 0 || day === 6
}

function isWorkday(date: string) {
  return !isWeekendDate(date) && !isHoliday(date)
}

function normalizeDateString(value: string | Date) {
  if (value instanceof Date) return formatKstDate(value)

  const datePart = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (datePart) return datePart

  return formatKstDate(new Date(value))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const userLevel = searchParams.get('userLevel')
    const scope = searchParams.get('scope')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const normalizedUserLevel = String(userLevel || '').toLowerCase()
    const isAdminOrLevel5 = scope !== 'self' && (['5', 'level5', 'admin', 'administrator'].includes(normalizedUserLevel) || userId === 'admin')

    const supabase = supabaseServer

    // 1. 최근 작동 기준일 (예: 14일치) — 주말 + 공휴일 제외
    const MAX_DAYS = 14
    const now = new Date()
    const todayStr = formatKstDate(now)

    const workDays: string[] = []
    for (let i = 1; i <= MAX_DAYS; i++) {
      const dateStr = addDaysToDateString(todayStr, -i)
      // 주말 또는 공휴일이면 근무일에서 제외
      if (isWorkday(dateStr)) {
        workDays.push(dateStr)
      }
    }
    const nowKst = new Date(now.toLocaleString('en-US', { timeZone: KST_TIME_ZONE }))
    const canReportToday = nowKst.getHours() > 16 || (nowKst.getHours() === 16 && nowKst.getMinutes() >= 30)
    if (canReportToday && isWorkday(todayStr)) {
      workDays.unshift(todayStr)
    }

    // 2. 조회할 대상 사용자 목록
    let targetUsers = []
    if (isAdminOrLevel5) {
      // 시스템 관리자(admin, administrator, 관리자) 계정 제외
      const { data: users } = await supabase
        .from('users')
        .select('id, name, department, level')
        
      targetUsers = users?.filter(u => {
        const idLower = String(u.id).toLowerCase();
        const nameLower = String(u.name).toLowerCase();
        return idLower !== 'admin' && nameLower !== 'administrator' && nameLower !== '관리자';
      }) || [];
    } else {
      const { data: user } = await supabase.from('users').select('id, name, department, level').eq('id', userId).single()
      targetUsers = user ? [user] : []
    }

    // 3. 최근 업무일지 데이터 조회
    const minDate = workDays[workDays.length - 1]
    const maxDate = workDays[0]

    let query = supabase
      .from('work_diary')
      .select('user_id, work_date')
      .gte('work_date', minDate)
      .lte('work_date', maxDate)

    if (!isAdminOrLevel5) {
      query = query.eq('user_id', userId)
    }

    const { data: diaries } = await query

    // 사용자/날짜별로 Set 구성
    const diarySet = new Set()
    diaries?.forEach(diary => {
      // YYYY-MM-DD 형식으로 비교
      const dateStr = normalizeDateString(diary.work_date)
      diarySet.add(`${diary.user_id}_${dateStr}`)
    })

    // 4. 연차/휴가 데이터도 포함하여 필터링

    // 4-1. events(캘린더) 테이블에서 연차/반차/휴가 조회
    //  - 라이브 DB에는 calendar_events 가 없고 events 가 캘린더 테이블이며,
    //    사용자 키 컬럼은 user_id 가 아니라 participant_id 이다.
    const { data: vacations } = await supabase
      .from('events')
      .select('participant_id, start_date')
      .in('category', ['연차', '반차', '휴가'])
      .gte('start_date', minDate)
      .lte('start_date', maxDate)

    vacations?.forEach(vac => {
      const dateStr = normalizeDateString(vac.start_date)
      diarySet.add(`${vac.participant_id}_${dateStr}`)
    })

    // 4-2. leave_requests 테이블에서 연차 조회 (start_date ~ end_date 범위 전체 제외)
    const { data: leaveRequests } = await supabase
      .from('leave_requests')
      .select('user_id, start_date, end_date')
      .lte('start_date', maxDate)
      .gte('end_date', minDate)

    leaveRequests?.forEach(leave => {
      // 다일 연차도 start_date ~ end_date 전체 날짜를 제외 목록에 추가
      const start = normalizeDateString(leave.start_date)
      const end = normalizeDateString(leave.end_date)
      for (let dateStr = start; dateStr <= end; dateStr = addDaysToDateString(dateStr, 1)) {
        if (!isWeekendDate(dateStr)) {
          diarySet.add(`${leave.user_id}_${dateStr}`)
        }
      }
    })

    // 5. 누락된 항목 탐색
    const missingReports: any[] = []
    
    targetUsers.forEach(u => {
      workDays.forEach(date => {
        if (!diarySet.has(`${u.id}_${date}`)) {
          missingReports.push({
            userId: u.id,
            userName: u.name,
            department: u.department,
            date: date
          })
        }
      })
    })

    // 날짜 역순(최신순)으로 정렬
    missingReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      data: missingReports,
      total: missingReports.length
    })

  } catch (error) {
    console.error('❌ 누락 업무일지 조회 중 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
