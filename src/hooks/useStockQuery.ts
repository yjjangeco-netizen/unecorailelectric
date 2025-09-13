import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logError, measureAsyncPerformance, normalizeOrderBy } from '@/lib/utils'
import type { CurrentStock, Item } from '@/lib/types'

// 정렬 필드 정규화 함수 (utils에서 가져옴)
// const normalizeOrderBy = (orderBy: string): string => {
//   const ALLOW = ['product', 'spec', 'maker', 'created_at', 'current_quantity', 'unit_price']
//   if (orderBy === 'name') return 'product'
//   return ALLOW.includes(orderBy) ? orderBy : 'product'
// }

// 재고 데이터 조회 (items 테이블에서 조회)
export const useStockQuery = (orderBy: string = 'product') => {
  const normalizedOrderBy = normalizeOrderBy(orderBy)
  
  return useQuery(['stock', 'current', normalizedOrderBy], async () => {
    return measureAsyncPerformance('재고 데이터 조회', async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order(normalizedOrderBy)

        if (error) {
          console.warn('Supabase 연결 실패, Mock 데이터 사용:', error)
          // Mock 데이터 반환
          return [
            {
              id: '1',
              item_id: '1',
              current_quantity: 50,
              location: '창고A',
              note: '테스트 아이템',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              product: '전기케이블',
              spec: '2.5SQ',
              maker: 'LS전선',
              category: '케이블',
              purpose: '전력공급',
              min_stock: 10,
              stock_status: 'active',
              unit_price: 5000,
              stock_in: 100,
              stock_out: 50,
              closing_quantity: 0,
              total_qunty: 50
            },
            {
              id: '2',
              item_id: '2',
              current_quantity: 30,
              location: '창고B',
              note: '테스트 아이템2',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              product: '전기스위치',
              spec: '20A',
              maker: 'LS산전',
              category: '스위치',
              purpose: '전력제어',
              min_stock: 5,
              stock_status: 'active',
              unit_price: 15000,
              stock_in: 50,
              stock_out: 20,
              closing_quantity: 0,
              total_qunty: 30
            }
          ]
        }

        // items 테이블에서 직접 데이터 반환 (현재고 계산 포함)
        return data?.map(item => {
          // 현재고 계산: 현재고 = 마감수량 + 입고수량 - 출고수량
          const calculatedCurrentQuantity = (item.closing_quantity || 0) + (item.stock_in || 0) - (item.stock_out || 0)
          
          return {
            id: item.id,
            item_id: item.id,
            current_quantity: calculatedCurrentQuantity, // 계산된 현재고 사용
            location: item.location,
            note: item.note,
            created_at: item.created_at,
            updated_at: item.updated_at,
            // items 테이블의 모든 정보
            product: item.name, // name을 product로 매핑
            spec: item.specification || '',
            maker: item.maker || '',
            category: item.category || '',
            purpose: item.purpose || '',
            min_stock: item.min_stock || 0,
            stock_status: item.stock_status,
            unit_price: item.unit_price,
            // stock_in, stock_out 추가
            stock_in: item.stock_in || 0,
            stock_out: item.stock_out || 0,
            closing_quantity: item.closing_quantity || 0,
            total_qunty: calculatedCurrentQuantity // 계산된 현재고로 설정
          }
        }) ?? []
      } catch (err) {
        console.error('데이터베이스 연결 실패:', err)
        throw err
      }
    })
  })
}

// 품목 데이터 조회 (items 테이블에서 조회)
export const useItemsQuery = () => {
  return useQuery(['items'], async () => {
    return measureAsyncPerformance('품목 데이터 조회', async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('product')

        if (error) {
          console.error('품목 데이터 조회 실패:', error)
          throw new Error(`품목 데이터 조회 실패: ${error.message}`)
        }

        return data ?? []
      } catch (err) {
        console.error('품목 데이터 조회 실패:', err)
        throw err
      }
    })
  })
}

// 재고 입고 처리
export const useStockInMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (stockInData: {
      item_id: string
      quantity: number
      unit_price: number
      received_by: string
      reason?: string
      note?: string
    }) => {
      // 1. 기존 재고 정보 조회
      const { data: existingStock, error: fetchError } = await supabase
        .from('items')
        .select('id, current_quantity, stock_in, closing_quantity, stock_out')
        .eq('id', stockInData.item_id)
        .single()

      if (fetchError) throw fetchError

      // 2. 새로운 수량 계산 (현재고 = 마감수량 + 입고수량 - 출고수량)
      const newStockIn = (existingStock?.stock_in || 0) + stockInData.quantity
      const newCurrentQuantity = (existingStock?.closing_quantity || 0) + newStockIn - (existingStock?.stock_out || 0)

      // 3. items 테이블 업데이트 (한 번에 모든 컬럼 업데이트)
      const { data: updateData, error: updateError } = await supabase
        .from('items')
        .update({ 
          current_quantity: newCurrentQuantity,
          stock_in: newStockIn,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockInData.item_id)
        .select()

      if (updateError) throw updateError

      // 4. stock_history에 입고 기록 추가
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          item_id: stockInData.item_id,
          event_type: 'IN',
          quantity: stockInData.quantity,
          unit_price: stockInData.unit_price,
          reason: stockInData.reason,
          received_by: stockInData.received_by,
          notes: stockInData.note
        })

      if (historyError) throw historyError

      return updateData
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock', 'current'])
      queryClient.invalidateQueries(['stock', 'history'])
    }
  })
}

// 재고 출고 처리
export const useStockOutMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (stockOutData: {
      item_id: string
      quantity: number
      issued_by: string
      project?: string
      note?: string
    }) => {
      // 1. 기존 재고 정보 조회
      const { data: existingStock, error: fetchError } = await supabase
        .from('items')
        .select('id, current_quantity, stock_in, closing_quantity, stock_out')
        .eq('id', stockOutData.item_id)
        .single()

      if (fetchError) throw fetchError

      // 2. 출고 가능 여부 확인 (현재고가 충분한지)
      const currentQuantity = (existingStock?.closing_quantity || 0) + (existingStock?.stock_in || 0) - (existingStock?.stock_out || 0)
      if (currentQuantity < stockOutData.quantity) {
        throw new Error(`재고 부족: 현재 ${currentQuantity}개, 요청 ${stockOutData.quantity}개`)
      }

      // 3. 새로운 수량 계산 (현재고 = 마감수량 + 입고수량 - 출고수량)
      const newStockOut = (existingStock?.stock_out || 0) + stockOutData.quantity
      const newCurrentQuantity = (existingStock?.closing_quantity || 0) + (existingStock?.stock_in || 0) - newStockOut

      // 4. items 테이블 업데이트 (한 번에 모든 컬럼 업데이트)
      const { data: updateData, error: updateError } = await supabase
        .from('items')
        .update({ 
          current_quantity: newCurrentQuantity,
          stock_out: newStockOut,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockOutData.item_id)
        .select()

      if (updateError) throw updateError

      // 5. stock_history에 출고 기록 추가
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          item_id: stockOutData.item_id,
          event_type: 'OUT',
          quantity: stockOutData.quantity,
          project: stockOutData.project,
          notes: stockOutData.note
        })

      if (historyError) throw historyError

      return updateData
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock', 'current'])
      queryClient.invalidateQueries(['stock', 'history'])
    }
  })
}

// 입고 이력 조회
export const useStockInHistoryQuery = () => {
  return useQuery(['stock', 'in', 'history'], async () => {
    return measureAsyncPerformance('입고 이력 조회', async () => {
      try {
        const { data, error } = await supabase
          .from('stock_history')
          .select(`
            *,
            items(product, spec, maker)
          `)
          .eq('event_type', 'stock_in')
          .order('event_date', { ascending: false })

        if (error) {
          console.error('입고 이력 조회 실패:', error)
          throw new Error(`입고 이력 조회 실패: ${error.message}`)
        }

        return data ?? []
      } catch (err) {
        console.error('입고 이력 조회 실패:', err)
        throw err
      }
    })
  })
}

// 출고 이력 조회
export const useStockOutHistoryQuery = () => {
  return useQuery(['stock', 'out', 'history'], async () => {
    return measureAsyncPerformance('출고 이력 조회', async () => {
      try {
        const { data, error } = await supabase
          .from('stock_history')
          .select(`
            *,
            items(product, spec, maker)
          `)
          .eq('event_type', 'stock_out')
          .order('event_date', { ascending: false })

        if (error) {
          console.error('출고 이력 조회 실패:', error)
          throw new Error(`출고 이력 조회 실패: ${error.message}`)
        }

        return data ?? []
      } catch (err) {
        console.error('출고 이력 조회 실패:', err)
        throw err
      }
    })
  })
}

// 검색된 재고 데이터
export const useSearchStockQuery = (searchTerm: string, orderBy: string = 'product') => {
  const normalizedOrderBy = normalizeOrderBy(orderBy)
  
  return useQuery(['stock', 'search', searchTerm, normalizedOrderBy], async () => {
    return measureAsyncPerformance('재고 검색', async () => {
      if (!searchTerm.trim()) {return []}

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .or(`product.ilike.%${searchTerm}%,spec.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order(normalizedOrderBy)

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
