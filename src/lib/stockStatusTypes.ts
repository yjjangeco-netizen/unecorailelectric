// 품목 상태 타입 정의 (데이터베이스 기준)
export type StockStatus = 'new' | 'used-new' | 'used-used' | 'broken'

// 품목 상태 상수 (데이터베이스 기준)
export const STOCK_STATUS = {
  NEW: 'new' as const,
  USED_NEW: 'used-new' as const,
  USED_USED: 'used-used' as const,
  BROKEN: 'broken' as const,
} as const

// 품목 상태 표시 텍스트 (한국어)
export const STOCK_STATUS_DISPLAY: Record<StockStatus, string> = {
  [STOCK_STATUS.NEW]: '신품',
  [STOCK_STATUS.USED_NEW]: '중고신품',
  [STOCK_STATUS.USED_USED]: '중고사용품',
  [STOCK_STATUS.BROKEN]: '불량품',
}

// 품목 상태 색상 (Tailwind CSS 클래스)
export const STOCK_STATUS_COLOR: Record<StockStatus, string> = {
  [STOCK_STATUS.NEW]: 'bg-blue-100 text-blue-800 border-blue-200',
  [STOCK_STATUS.USED_NEW]: 'bg-green-100 text-green-800 border-green-200',
  [STOCK_STATUS.USED_USED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [STOCK_STATUS.BROKEN]: 'bg-red-100 text-red-800 border-red-200',
}

// 품목 상태 설명
export const STOCK_STATUS_DESCRIPTION: Record<StockStatus, string> = {
  [STOCK_STATUS.NEW]: '새로운 제품, 미사용 상태',
  [STOCK_STATUS.USED_NEW]: '중고이지만 거의 새것과 같은 상태',
  [STOCK_STATUS.USED_USED]: '사용된 흔적이 있는 중고 제품',
  [STOCK_STATUS.BROKEN]: '고장나거나 불량한 제품',
}

// 품목 상태 표시 텍스트 반환 함수
export const getStockStatusDisplay = (status: StockStatus): string => {
  return STOCK_STATUS_DISPLAY[status] || '알 수 없음'
}

// 품목 상태 색상 반환 함수
export const getStockStatusColor = (status: StockStatus): string => {
  return STOCK_STATUS_COLOR[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// 품목 상태 설명 반환 함수
export const getStockStatusDescription = (status: StockStatus): string => {
  return STOCK_STATUS_DESCRIPTION[status] || '설명 없음'
}

// 데이터베이스 값과 프로그램 값 간 변환 함수들

// 데이터베이스 값 → 프로그램 값 (더 이상 필요 없음, 동일한 값 사용)
export const convertDbToProgram = (dbValue: string): StockStatus => {
  if (dbValue === 'new') return 'new'
  if (dbValue === 'used-new') return 'used-new'
  if (dbValue === 'used-used') return 'used-used'
  if (dbValue === 'broken') return 'broken'
  return 'new' // 기본값
}

// 프로그램 값 → 데이터베이스 값 (더 이상 필요 없음, 동일한 값 사용)
export const convertProgramToDb = (programValue: StockStatus): string => {
  return programValue
}

// kebab-case를 snake_case로 변환 (더 이상 필요 없음)
export const convertKebabToSnake = (value: string): string => {
  return value.replace(/-/g, '_')
}

// snake_case를 kebab-case로 변환 (더 이상 필요 없음)
export const convertSnakeToKebab = (value: string): string => {
  return value.replace(/_/g, '-')
}

// 품목 상태 유효성 검사
export const isValidStockStatus = (status: string): status is StockStatus => {
  return ['new', 'used-new', 'used-used', 'broken'].includes(status)
}

// 품목 상태 목록 반환
export const getStockStatusList = (): StockStatus[] => {
  return ['new', 'used-new', 'used-used', 'broken']
}
