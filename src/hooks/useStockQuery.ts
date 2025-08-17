import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import type { StockIn, StockOut } from '@/lib/supabase'

const supabase = createBrowserSupabaseClient()

// 재고 데이터 조회
export const useStockQuery = () => {
  return useQuery(['stock', 'current'], async () => {
    return measureAsyncPerformance('재고 데이터 조회', async () => {
      const { data, error } = await supabase
        .from('current_stock')
        .select('*')
        .order('name')

      if (error) {
        logError('재고 데이터 조회 오류', error)
        throw new Error(`재고 데이터 조회 실패: ${error.message}`)
      }

      return data ?? []
    })
  })
}

// 품목 데이터 조회
export const useItemsQuery = () => {
  return useQuery(['items'], async () => {
    return measureAsyncPerformance('품목 데이터 조회', async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name')

      if (error) {
        logError('품목 데이터 조회 오류', error)
        throw new Error(`품목 데이터 조회 실패: ${error.message}`)
      }

      return data ?? []
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
