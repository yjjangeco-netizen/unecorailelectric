import { NextRequest } from 'next/server'
import { POST } from '../transaction/route'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    rpc: jest.fn()
  }))
}))

jest.mock('@/lib/utils', () => ({
  logError: jest.fn(),
  measureAsyncPerformance: jest.fn((name, fn) => fn())
}))

jest.mock('@/lib/audit', () => ({
  serverAuditLogger: {
    logStockOperation: jest.fn()
  }
}))

describe('Stock Transaction API', () => {
  let mockSupabase: {
    from: jest.Mock
    rpc: jest.Mock
  }
  let mockRequest: Partial<NextRequest>

  beforeEach(() => {
    const { createServerSupabaseClient } = require('@/lib/supabase')
    mockSupabase = createServerSupabaseClient()
    
    mockRequest = {
      json: jest.fn(),
    }
    
    jest.clearAllMocks()
  })

  describe('입고 처리 테스트', () => {
    const stockInData = {
      action: 'stock_in',
      data: {
        itemName: '테스트품목',
        quantity: 100,
        unitPrice: 5000,
        conditionType: 'new',
        reason: '테스트입고',
        orderedBy: '홍길동',
        notes: '단위테스트용'
      }
    }

    test('정상 입고 처리', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue(stockInData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          item_id: 'item123',
          item_name: '테스트품목',
          quantity_added: 100,
          new_quantity: 100,
          weighted_avg_price: 5000
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.ok).toBe(true)
      expect(result.data.itemName).toBe('테스트품목')
      expect(result.data.quantity).toBe(100)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('process_stock_in', expect.any(Object))
    })

    test('인증 실패 시 401 반환', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue(stockInData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' }
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('인증이 필요합니다')
    })

    test('잘못된 입력 데이터 처리', async () => {
      // Arrange
      const invalidData = {
        action: 'stock_in',
        data: {
          itemName: '', // 빈 문자열
          quantity: -10, // 음수
          unitPrice: 'invalid' // 문자열
        }
      }
      
      mockRequest.json = jest.fn().mockResolvedValue(invalidData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('검증')
    })

    test('데이터베이스 오류 처리', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue(stockInData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('입고 처리 실패')
    })
  })

  describe('출고 처리 테스트', () => {
    const stockOutData = {
      action: 'stock_out',
      data: {
        itemId: 'item123',
        quantity: 10,
        project: '프로젝트A',
        notes: '테스트출고',
        isRental: false
      }
    }

    test('정상 출고 처리', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue(stockOutData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          item_id: 'item123',
          item_name: '테스트품목',
          quantity_issued: 10,
          previous_quantity: 100,
          new_quantity: 90
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.ok).toBe(true)
      expect(result.data.quantity).toBe(10)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('process_stock_out', expect.any(Object))
    })

    test('재고 부족 시 실패', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({
        ...stockOutData,
        data: { ...stockOutData.data, quantity: 1000 } // 재고보다 많은 수량
      })
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: '재고가 부족합니다. 현재 재고: 90개, 요청 수량: 1000개',
          error_code: 'INSUFFICIENT_STOCK',
          current_quantity: 90,
          requested_quantity: 1000
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('재고가 부족합니다')
    })

    test('존재하지 않는 품목 출고 시도', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({
        ...stockOutData,
        data: { ...stockOutData.data, itemId: 'nonexistent-item' }
      })
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: '존재하지 않는 품목입니다',
          error_code: 'ITEM_NOT_FOUND'
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('존재하지 않는 품목')
    })
  })

  describe('대량 작업 처리 테스트', () => {
    const bulkData = {
      action: 'bulk_operation',
      data: {
        operations: [
          { itemName: '품목1', quantity: 50, unitPrice: 1000, conditionType: 'new' },
          { itemName: '품목2', quantity: 30, unitPrice: 2000, conditionType: 'used_good' }
        ],
        operationType: 'stock_in'
      }
    }

    test('대량 입고 성공', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue(bulkData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          batch_id: 'batch123',
          total_operations: 2,
          success_count: 2,
          error_count: 0,
          success_rate: 100.0
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.ok).toBe(true)
      expect(result.data.totalOperations).toBe(2)
      expect(result.data.successCount).toBe(2)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('process_bulk_operations', expect.any(Object))
    })

    test('일부 작업 실패한 대량 처리', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue(bulkData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          batch_id: 'batch123',
          total_operations: 2,
          success_count: 1,
          error_count: 1,
          success_rate: 50.0,
          results: [
            { success: true, item_id: 'item1' },
            { success: false, error: '재고 부족', error_code: 'INSUFFICIENT_STOCK' }
          ]
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.ok).toBe(false)
      expect(result.data.successRate).toBe(50.0)
    })
  })

  describe('경계값 테스트', () => {
    test('수량 0인 입고 시도', async () => {
      // Arrange
      const zeroQuantityData = {
        action: 'stock_in',
        data: {
          itemName: '테스트품목',
          quantity: 0, // 경계값: 0
          unitPrice: 5000,
          conditionType: 'new'
        }
      }
      
      mockRequest.json = jest.fn().mockResolvedValue(zeroQuantityData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      // Act & Assert
      await expect(POST(mockRequest as NextRequest)).resolves.toMatchObject({
        status: 500 // 검증 오류로 500 예상
      })
    })

    test('최대 수량 입고 시도', async () => {
      // Arrange
      const maxQuantityData = {
        action: 'stock_in',
        data: {
          itemName: '테스트품목',
          quantity: 999999, // 경계값: 최대 허용
          unitPrice: 5000,
          conditionType: 'new'
        }
      }
      
      mockRequest.json = jest.fn().mockResolvedValue(maxQuantityData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          quantity_added: 999999
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.ok).toBe(true)
    })

    test('재고와 정확히 동일한 수량 출고', async () => {
      // Arrange
      const exactQuantityData = {
        action: 'stock_out',
        data: {
          itemId: 'item123',
          quantity: 50, // 현재 재고와 정확히 동일
          project: '전체출고테스트'
        }
      }
      
      mockRequest.json = jest.fn().mockResolvedValue(exactQuantityData)
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          previous_quantity: 50,
          new_quantity: 0, // 정확히 0이 되어야 함
          low_stock_warning: true
        },
        error: null
      })

      // Act
      const response = await POST(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.ok).toBe(true)
      expect(result.data.newQuantity).toBe(0)
    })
  })

  describe('동시성 에뮬레이션 테스트', () => {
    test('동시 출고 요청 처리', async () => {
      const concurrentRequests = Array(5).fill(null).map(() => ({
        action: 'stock_out',
        data: {
          itemId: 'same-item-123',
          quantity: 10,
          project: '동시성테스트'
        }
      }))

      // 첫 번째 요청만 성공, 나머지는 재고 부족으로 실패
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null
      })

      let callCount = 0
      mockSupabase.rpc.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            data: { success: true, new_quantity: 40 },
            error: null
          })
        } else {
          return Promise.resolve({
            data: { 
              success: false, 
              error: '재고가 부족합니다',
              error_code: 'INSUFFICIENT_STOCK'
            },
            error: null
          })
        }
      })

      // 모든 요청을 동시에 실행
      const promises = concurrentRequests.map(data => {
        const req = { json: jest.fn().mockResolvedValue(data) } as Partial<NextRequest>
        return POST(req as NextRequest)
      })

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))

      // 하나는 성공, 나머지는 실패해야 함
      const successCount = results.filter(r => r.ok).length
      const failCount = results.filter(r => !r.ok).length

      expect(successCount).toBe(1)
      expect(failCount).toBe(4)
    })
  })
})
