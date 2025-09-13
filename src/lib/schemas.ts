import { z } from 'zod'
import { StockStatus, STOCK_STATUS } from './stockStatusTypes'

// 기본 검증 규칙
const positiveInteger = z.number().int().positive('양의 정수여야 합니다')
const nonNegativeInteger = z.number().int().min(0, '0 이상의 정수여야 합니다')
const nonNegativeNumber = z.number().min(0, '0 이상의 숫자여야 합니다')
const safeString = z.string().trim().min(1, '필수 입력 항목입니다').max(500, '500자 이하여야 합니다')

// 품목 스키마 (데이터베이스와 일치)
export const itemSchema = z.object({
  name: safeString.max(100, '품목명은 100자 이하여야 합니다'),
  specification: safeString.max(200, '규격은 200자 이하여야 합니다'),
  maker: safeString.max(100, '제조사는 100자 이하여야 합니다'),
  location: safeString.max(100, '보관위치는 100자 이하여야 합니다'),
  unit_price: nonNegativeNumber.max(999999999, '단가는 10억원 이하여야 합니다'),
  purpose: safeString.max(200, '용도는 200자 이하여야 합니다'),
  min_stock: nonNegativeInteger.max(999999, '최소재고는 999,999개 이하여야 합니다'),
  category: z.string().max(50, '카테고리는 50자 이하여야 합니다').optional(),
  note: z.string().max(1000, '비고는 1000자 이하여야 합니다').optional(),
  status: z.enum(['사용중', '단종', '중지']).default('사용중'),
  stock_status: z.nativeEnum(STOCK_STATUS).default(STOCK_STATUS.NEW),
})

// 입고 스키마 (데이터베이스와 일치)
export const stockInSchema = z.object({
  name: safeString.max(100, '품목명은 100자 이하여야 합니다'),
  specification: safeString.max(200, '규격은 200자 이하여야 합니다'),
  maker: safeString.max(100, '제조사는 100자 이하여야 합니다'),
  location: safeString.max(100, '위치는 100자 이하여야 합니다'),
  quantity: positiveInteger.max(2147483647, '수량은 2,147,483,647개 이하여야 합니다'),
  unit_price: nonNegativeNumber.max(999999999999.99, '단가는 999,999,999,999.99원 이하여야 합니다'),
  stock_status: z.nativeEnum(STOCK_STATUS).default(STOCK_STATUS.NEW),
  reason: z.string().max(200, '사유는 200자 이하여야 합니다').optional(),
  note: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
})

// 출고 스키마 (데이터베이스와 일치)
export const stockOutSchema = z.object({
  itemId: z.string().uuid('유효한 UUID여야 합니다'), // itemId 추가
  name: safeString.max(100, '품목명은 100자 이하여야 합니다'),
  specification: safeString.max(200, '규격은 200자 이하여야 합니다'),
  maker: safeString.max(100, '제조사는 100자 이하여야 합니다'),
  location: safeString.max(100, '위치는 100자 이하여야 합니다'),
  quantity: positiveInteger.max(999999, '수량은 999,999개 이하여야 합니다'),
  project: z.string().max(100, '프로젝트는 100자 이하여야 합니다').optional(),
  note: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
  is_rental: z.boolean().default(false),
  return_date: z.string().datetime().optional(),
})

// 재고 조정 스키마 (데이터베이스와 일치)
export const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid('유효한 UUID여야 합니다'), // itemId 추가
  name: safeString.max(100, '품목명은 100자 이하여야 합니다'),
  specification: safeString.max(200, '규격은 200자 이하여야 합니다'),
  adjustment_type: z.enum(['PLUS', 'MINUS', 'ADJUSTMENT']),
  quantity: nonNegativeInteger.max(999999, '수량은 999,999개 이하여야 합니다'),
  reason: safeString.max(200, '조정 사유는 200자 이하여야 합니다'),
  note: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
})

// 대량 작업 스키마 (데이터베이스와 일치)
export const bulkOperationSchema = z.object({
  operations: z.array(z.object({
    name: safeString.max(100, '품목명은 100자 이하여야 합니다'),
    specification: safeString.max(200, '규격은 200자 이하여야 합니다'),
    maker: safeString.max(100, '제조사는 100자 이하여야 합니다'),
    location: safeString.max(100, '위치는 100자 이하여야 합니다'),
    quantity: positiveInteger.max(999999, '수량은 999,999개 이하여야 합니다'),
    unit_price: nonNegativeNumber.max(999999999, '단가는 10억원 이하여야 합니다'),
    stock_status: z.nativeEnum(STOCK_STATUS).default(STOCK_STATUS.NEW),
    reason: z.string().max(200, '사유는 200자 이하여야 합니다').optional(),
    note: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
  })).min(1, '최소 1개 이상의 작업이 필요합니다').max(100, '최대 100개까지 처리 가능합니다'),
  operation_type: z.enum(['stock_in', 'stock_out']),
})

// 사용자 스키마 (데이터베이스와 일치)
export const userSchema = z.object({
  username: z.string().min(3, '사용자명은 3자 이상이어야 합니다').max(50, '사용자명은 50자 이하여야 합니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').max(100, '비밀번호는 100자 이하여야 합니다'),
  name: safeString.max(100, '이름은 100자 이하여야 합니다'),
  department: safeString.max(100, '부서는 100자 이하여야 합니다'),
  position: safeString.max(100, '직책은 100자 이하여야 합니다'),
  level: z.string().max(50, '레벨은 50자 이하여야 합니다').optional(),
  is_active: z.boolean().default(true),
  email: z.string().email('유효한 이메일 형식이어야 합니다').optional(),
})

// 로그인 스키마
export const loginSchema = z.object({
  username: z.string().min(3, '사용자명은 3자 이상이어야 합니다').max(50, '사용자명은 50자 이하여야 합니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

// 검색 스키마
export const searchSchema = z.object({
  query: z.string().min(1, '검색어를 입력해주세요').max(200, '검색어는 200자 이하여야 합니다'),
  category: z.string().max(50).optional(),
  min_price: nonNegativeNumber.optional(),
  max_price: nonNegativeNumber.optional(),
  in_stock: z.boolean().optional(),
})

// CSV 업로드 스키마
export const csvUploadSchema = z.object({
  file: z.instanceof(File, { message: '파일을 선택해주세요' }),
  file_size: z.number().max(10 * 1024 * 1024, '파일 크기는 10MB 이하여야 합니다'), // 10MB 제한
  file_type: z.string().refine(type => type === 'text/csv', 'CSV 파일만 업로드 가능합니다'),
})

// 분기 마감 스키마
export const quarterClosingSchema = z.object({
  quarter: z.number().int().min(1, '분기는 1-4 사이여야 합니다').max(4),
  year: z.number().int().min(2020, '연도는 2020년 이후여야 합니다').max(2030),
  closing_date: z.string().datetime('유효한 날짜 형식이어야 합니다'),
  note: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
})

// API 응답 스키마
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  })

// 에러 응답 스키마
export const errorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
})

// 성공 응답 스키마
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
    timestamp: z.string().datetime(),
  })

// 기본 타입 정의 (Zod 스키마에서 추론)
export type ItemInput = z.infer<typeof itemSchema>
export type StockInInput = z.infer<typeof stockInSchema>
export type StockOutInput = z.infer<typeof stockOutSchema>
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>
export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type CsvUploadInput = z.infer<typeof csvUploadSchema>
export type QuarterClosingInput = z.infer<typeof quarterClosingSchema>

// Item 인터페이스 정의 - stock_status 타입 통일 (데이터베이스 기준)
export interface Item extends ItemInput {
  id: string;
  created_at: string;
  updated_at: string;
  stock_status: StockStatus; // 통일된 타입 사용 (데이터베이스 기준)
}

export interface StockHistory {
  id: string
  item_id: string
  event_type: 'IN' | 'OUT' | 'PLUS' | 'MINUS' | 'DISPOSAL' | 'ADJUSTMENT'
  quantity: number
  unit_price?: number
  stock_status?: StockStatus // 통일된 타입 사용 (데이터베이스 기준)
  reason?: string
  ordered_by?: string
  received_by?: string
  project?: string
  note?: string
  is_rental?: boolean
  return_date?: string
  event_date: string
  created_at: string
}

export interface StockIn extends StockInInput {
  id: string
  item_id?: string
  received_at: string
  received_by: string
}

export interface StockOut extends StockOutInput {
  id: string
  item_id?: string
  issued_at: string
  issued_by: string
}

export interface StockAdjustment extends StockAdjustmentInput {
  id: string
  adjusted_at: string
  adjusted_by: string
}

export interface BulkOperation extends BulkOperationInput {
  id: string
  created_at: string
  created_by: string
}

export interface User extends Omit<UserInput, 'password'> {
  id: string
  created_at: string
  updated_at: string
  last_login?: string
}

// 타입 별칭 (하위 호환성)
export type Login = LoginInput
export type Search = SearchInput
export type CsvUpload = CsvUploadInput
export type QuarterClosing = QuarterClosingInput

// 검증 함수들 (입력용)
export const validateItem = (data: unknown): ItemInput => itemSchema.parse(data)
export const validateStockIn = (data: unknown): StockInInput => stockInSchema.parse(data)
export const validateStockOut = (data: unknown): StockOutInput => stockOutSchema.parse(data)
export const validateStockAdjustment = (data: unknown): StockAdjustmentInput => stockAdjustmentSchema.parse(data)
export const validateBulkOperation = (data: unknown): BulkOperationInput => bulkOperationSchema.parse(data)
export const validateUser = (data: unknown): UserInput => userSchema.parse(data)
export const validateLogin = (data: unknown): LoginInput => loginSchema.parse(data)
export const validateSearch = (data: unknown): SearchInput => searchSchema.parse(data)
export const validateCsvUpload = (data: unknown): CsvUploadInput => csvUploadSchema.parse(data)
export const validateQuarterClosing = (data: unknown): QuarterClosingInput => quarterClosingSchema.parse(data)

// 안전한 검증 함수 (에러 발생 시 기본값 반환)
export const safeValidate = <T>(schema: z.ZodType<T>, data: unknown, fallback: T): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error('데이터 검증 실패:', error)
    return fallback
  }
}
