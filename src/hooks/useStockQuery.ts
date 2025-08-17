import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import type { StockIn, StockOut } from '@/lib/supabase'

const supabase = createBrowserSupabaseClient()

// 로컬 데모 데이터 (Supabase 연결 실패 시 사용)
const demoStockData = [
  {
    id: '1',
    name: '전선 (2.0SQ)',
    specification: '2.0SQ',
    maker: 'LS전선',
    unit_price: 1500,
    current_quantity: 100,
    total_amount: 150000,
    notes: '전기 배선용',
    category: '전선',
    stock_status: 'normal' as const,
    location: 'A-01',
    material: '구리',
    unit: 'M',
    previousQuarterQuantity: 80,
    stockInQuantity: 50,
    stockOutQuantity: 30,
    actualQuantity: 100,
    stockOutContent: '배선공사'
  },
  {
    id: '2',
    name: '차단기 (20A)',
    specification: '20A',
    maker: 'LS산전',
    unit_price: 25000,
    current_quantity: 15,
    total_amount: 375000,
    notes: '전기 차단용',
    category: '차단기',
    stock_status: 'normal' as const,
    location: 'B-02',
    material: '플라스틱',
    unit: '개',
    previousQuarterQuantity: 20,
    stockInQuantity: 10,
    stockOutQuantity: 15,
    actualQuantity: 15,
    stockOutContent: '설비교체'
  },
  {
    id: '3',
    name: '콘센트 (220V)',
    specification: '220V 15A',
    maker: 'LS산전',
    unit_price: 8000,
    current_quantity: 50,
    total_amount: 400000,
    notes: '전기 콘센트',
    category: '콘센트',
    stock_status: 'normal' as const,
    location: 'C-03',
    material: '플라스틱',
    unit: '개',
    previousQuarterQuantity: 60,
    stockInQuantity: 20,
    stockOutQuantity: 30,
    actualQuantity: 50,
    stockOutContent: '신규설치'
  }
]

// 재고 데이터 조회
export const useStockQuery = () => {
  return useQuery(['stock', 'current'], async () => {
    return measureAsyncPerformance('재고 데이터 조회', async () => {
      try {
        const { data, error } = await supabase
          .from('current_stock')
          .select('*')
          .order('name')

        if (error) {
          console.warn('Supabase 연결 실패, 로컬 데이터 사용:', error)
          return demoStockData
        }

        return data ?? []
      } catch (err) {
        console.warn('데이터베이스 연결 실패, 로컬 데이터 사용:', err)
        return demoStockData
      }
    })
  })
}

// 품목 데이터 조회
export const useItemsQuery = () => {
  return useQuery(['items'], async () => {
    return measureAsyncPerformance('품목 데이터 조회', async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('name')

        if (error) {
          console.warn('품목 데이터 조회 실패, 로컬 데이터 사용:', error)
          return demoStockData.map(item => ({
            id: item.id,
            name: item.name,
            specification: item.specification,
            maker: item.maker || '미정',
            unit_price: item.unit_price,
            purpose: '재고관리',
            min_stock: 10,
            category: item.category,
            description: item.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        }

        return data ?? []
      } catch (err) {
        console.warn('품목 데이터 조회 실패, 로컬 데이터 사용:', err)
        return demoStockData.map(item => ({
          id: item.id,
          name: item.name,
          specification: item.specification,
          maker: item.maker || '미정',
          unit_price: item.unit_price,
          purpose: '재고관리',
          min_stock: 10,
          category: item.category,
          description: item.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      }
    })
  })
}

// 입고 이력 조회
export const useStockInHistoryQuery = (itemId?: string) => {
  return useQuery(['stock-in', 'history', itemId], async () => {
    return measureAsyncPerformance('입고 이력 조회', async () => {
      let query = supabase
        .from('stock_in')
        .select(`
          *,
          items(name, specification, maker)
        `)
        .order('received_at', { ascending: false })

      if (itemId) {
        query = query.eq('item_id', itemId)
      }

      const { data, error } = await query

      if (error) {
        logError('입고 이력 조회 오류', error)
        throw new Error(`입고 이력 조회 실패: ${error.message}`)
      }

      return data ?? []
    })
  }, {
    enabled: !!itemId
  })
}

// 출고 이력 조회
export const useStockOutHistoryQuery = (itemId?: string) => {
  return useQuery(['stock-out', 'history', itemId], async () => {
    return measureAsyncPerformance('출고 이력 조회', async () => {
      let query = supabase
        .from('stock_out')
        .select(`
          *,
          items(name, specification, maker)
        `)
        .order('issued_at', { ascending: false })

      if (itemId) {
        query = query.eq('item_id', itemId)
      }

      const { data, error } = await query

      if (error) {
        logError('출고 이력 조회 오류', error)
        throw new Error(`출고 이력 조회 실패: ${error.message}`)
      }

      return data ?? []
    })
  }, {
    enabled: !!itemId
  })
}

// 검색된 재고 데이터
export const useSearchStockQuery = (searchTerm: string) => {
  return useQuery(['stock', 'search', searchTerm], async () => {
    return measureAsyncPerformance('재고 검색', async () => {
      if (!searchTerm.trim()) {return []}

      const { data, error } = await supabase
        .from('current_stock')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,specification.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order('name')

      if (error) {
        logError('재고 검색 오류', error)
        throw new Error(`재고 검색 실패: ${error.message}`)
      }

      return data ?? []
    })
  }, {
    enabled: searchTerm.trim().length > 0
  })
}

// 입고 처리 뮤테이션
export const useStockInMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (stockInData: Omit<StockIn, 'id' | 'received_at'>) => {
      return measureAsyncPerformance('입고 처리', async () => {
        const { data, error } = await supabase
          .from('stock_in')
          .insert(stockInData)
          .select()
          .single()

        if (error) {
          logError('입고 처리 오류', error)
          throw new Error(`입고 처리 실패: ${error.message}`)
        }

        return data
      })
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['stock', 'current'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stock-in', 'history'] })
    },
    onError: (error: unknown) => {
      logError('입고 뮤테이션 오류', error)
    },
  })
}

// 출고 처리 뮤테이션
export const useStockOutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (stockOutData: Omit<StockOut, 'id' | 'issued_at'>) => {
      return measureAsyncPerformance('출고 처리', async () => {
        const { data, error } = await supabase
          .from('stock_out')
          .insert(stockOutData)
          .select()
          .single()

        if (error) {
          logError('출고 처리 오류', error)
          throw new Error(`출고 처리 실패: ${error.message}`)
        }

        return data
      })
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['stock', 'current'] })
      queryClient.invalidateQueries({ queryKey: ['stock-out', 'history'] })
    },
    onError: (error: unknown) => {
      logError('출고 뮤테이션 오류', error)
    },
  })
}

// 재고 조정 뮤테이션
export const useStockAdjustmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adjustmentData: { itemId: string; quantity: number; reason: string }) => {
      return measureAsyncPerformance('재고 조정', async () => {
        const { data, error } = await supabase
          .from('current_stock')
          .update({
            current_quantity: adjustmentData.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', adjustmentData.itemId)
          .select()
          .single()

        if (error) {
          logError('재고 조정 오류', error)
          throw new Error(`재고 조정 실패: ${error.message}`)
        }

        return data
      })
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['stock', 'current'] })
    },
    onError: (error: unknown) => {
      logError('재고 조정 뮤테이션 오류', error)
    },
  })
}
