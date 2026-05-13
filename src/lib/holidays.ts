/**
 * 한국 공휴일 유틸리티
 * - 양력 고정 공휴일 + 연도별 음력 공휴일을 관리합니다.
 * - 대체공휴일은 포함되어 있지 않습니다 (필요시 연도별로 추가).
 */

// 매년 반복되는 양력 고정 공휴일 (MM-DD)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-01': '근로자의 날',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '크리스마스',
}

// 연도별 음력 공휴일 (YYYY-MM-DD)
// ※ 매년 초에 해당 연도의 음력 공휴일을 추가해야 합니다.
const LUNAR_HOLIDAYS: Record<string, string> = {
  // 2025년
  '2025-01-28': '설날',
  '2025-01-29': '설날',
  '2025-01-30': '설날',
  '2025-05-05': '부처님오신날',
  '2025-10-05': '추석',
  '2025-10-06': '추석',
  '2025-10-07': '추석',
  // 2026년
  '2026-01-29': '설날',
  '2026-01-30': '설날',
  '2026-01-31': '설날',
  '2026-05-24': '부처님오신날',
  '2026-06-03': '선거일',
  '2026-09-25': '추석',
  '2026-09-26': '추석',
  '2026-09-27': '추석',
  // 2027년
  '2027-02-16': '설날',
  '2027-02-17': '설날',
  '2027-02-18': '설날',
  '2027-05-13': '부처님오신날',
  '2027-10-14': '추석',
  '2027-10-15': '추석',
  '2027-10-16': '추석',
}

/**
 * 특정 날짜가 공휴일인지 확인합니다.
 * @param date Date 객체 또는 'YYYY-MM-DD' 형식 문자열
 * @returns 공휴일명 또는 null
 */
export const getHoliday = (date: Date | string): string | null => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const yyyymmdd = `${d.getFullYear()}-${mmdd}`

  // 음력 공휴일 먼저 확인 (연도별)
  if (LUNAR_HOLIDAYS[yyyymmdd]) return LUNAR_HOLIDAYS[yyyymmdd]

  // 양력 고정 공휴일 확인
  if (FIXED_HOLIDAYS[mmdd]) return FIXED_HOLIDAYS[mmdd]

  return null
}

/**
 * 특정 날짜가 공휴일인지 여부만 반환합니다.
 * @param date Date 객체 또는 'YYYY-MM-DD' 형식 문자열
 */
export const isHoliday = (date: Date | string): boolean => {
  return getHoliday(date) !== null
}

/**
 * 특정 날짜가 주말인지 확인합니다.
 * @param date Date 객체
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * 특정 날짜가 근무일이 아닌지 확인합니다 (주말 또는 공휴일).
 * @param date Date 객체 또는 'YYYY-MM-DD' 형식 문자열
 */
export const isNonWorkday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return isWeekend(d) || isHoliday(d)
}

// 기존 MobileCalendar 호환용: MM-DD 기반 공휴일 맵 (연도 무관 표시용)
export const HOLIDAYS_MAP: Record<string, string> = {
  ...FIXED_HOLIDAYS,
  // 2026년 음력 공휴일 (MM-DD 형식)
  '01-29': '설날',
  '01-30': '설날',
  '01-31': '설날',
  '05-24': '부처님오신날',
  '09-25': '추석',
  '09-26': '추석',
  '09-27': '추석',
}
