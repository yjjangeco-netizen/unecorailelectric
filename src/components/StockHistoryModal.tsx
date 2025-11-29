'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Package, Info } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

import type { CurrentStock } from '@/lib/types'

interface StockHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  item?: CurrentStock | null
}

interface StockHistoryItem {
  id: string
  itemName: string
  spec: string
  maker: string
  purpose: string
  unitPrice: number
  quantity: number
  totalAmount: number
  transactionType: 'in' | 'out'
  transactionDate: string
  notes: string
  remaining: number
  itemCondition?: 'new' | 'used-new' | 'used-used' | 'broken'
}

export default function StockHistoryModal({ isOpen, onClose, item }: StockHistoryModalProps) {
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getItemConditionText = (condition?: string) => {
    if (!condition) return '신품'
    switch (condition) {
      case 'new': return '신품'
      case 'used-new': return '중고신품'
      case 'used-used': return '중고사용품'
      case 'broken': return '고장'
      default: return '신품'
    }
  }

  const getItemConditionColor = (condition?: string) => {
    if (!condition || condition === 'new') {
      return 'bg-green-100 text-green-800'
    } else {
      return 'bg-orange-100 text-orange-800'
    }
  }

  // 실제 입출고 내역 데이터 로드
  useEffect(() => {
    if (item && isOpen) {
      loadStockHistory()
    }
  }, [item, isOpen])

  const loadStockHistory = async () => {
    if (!item?.id) {
      console.error('품목 ID가 없습니다:', item)
      setError('품목 ID가 없습니다.')
      return
    }

    // item 객체의 실제 데이터 확인
    console.log('전달받은 item 객체:', item)
    console.log('품목명:', item.name)
    console.log('현재 재고:', item.current_quantity)
    console.log('품목 상태:', item.stock_status)

    // ID 형식 검증 - UUID 또는 숫자 ID 모두 허용
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const numericIdRegex = /^\d+$/
    
    console.log('ID 검증 시작:', { id: item.id, type: typeof item.id })
    console.log('UUID 패턴 매치:', uuidRegex.test(item.id))
    console.log('숫자 ID 패턴 매치:', numericIdRegex.test(item.id))
    
    if (!uuidRegex.test(item.id) && !numericIdRegex.test(item.id)) {
      console.error('잘못된 ID 형식:', item.id)
      setError(`잘못된 품목 ID 형식입니다: ${item.id}`)
      return
    }

    console.log('ID 검증 통과:', item.id)
    setLoading(true)
    setError('')
    
    try {
      console.log('재고 내역 로드 시작:', item.id)
      
      // 입고 이력 조회
      const { data: stockInData, error: stockInError } = await supabase
        .from('stock_in')
        .select(`
          *,
          items(name, specification, maker)
        `)
        .eq('item_id', item.id)
        .order('received_at', { ascending: false })

      if (stockInError) {
        console.error('입고 이력 조회 오류:', stockInError)
        throw new Error(`입고 이력 조회 실패: ${stockInError.message}`)
      }

      // 출고 이력 조회
      const { data: stockOutData, error: stockOutError } = await supabase
        .from('stock_out')
        .select(`
          *,
          items(name, specification, maker)
        `)
        .eq('item_id', item.id)
        .order('issued_at', { ascending: false })

      if (stockOutError) {
        console.error('출고 이력 조회 오류:', stockOutError)
        throw new Error(`출고 이력 조회 실패: ${stockOutError.message}`)
      }

      // 입출고 이력을 하나의 배열로 합치고 날짜순 정렬
      const allHistory = [
        ...((stockInData as any)?.map((inItem: any) => ({
          id: `in-${inItem.id}`,
          itemName: inItem.items?.name || inItem.product || '', // items 조인 결과 또는 기존 필드 사용
          spec: inItem.items?.specification || inItem.spec || '',
          maker: inItem.items?.maker || inItem.maker || '',
          purpose: inItem.purpose,
          unitPrice: inItem.unit_price,
          quantity: inItem.quantity,
          totalAmount: inItem.total_amount,
          transactionType: 'in' as const,
          transactionDate: inItem.received_at,
          notes: inItem.note,
          remaining: 0, // TODO: 누적 계산 로직 추가
          itemCondition: inItem.item_condition
        })) ?? []),
        ...((stockOutData as any)?.map((outItem: any) => ({
          id: `out-${outItem.id}`,
          itemName: outItem.items?.name || outItem.product || '',
          spec: outItem.items?.specification || outItem.spec || '',
          maker: outItem.items?.maker || outItem.maker || '',
          purpose: outItem.purpose,
          unitPrice: outItem.unit_price,
          quantity: -outItem.quantity, // 출고는 음수로 표시
          totalAmount: outItem.total_amount,
          transactionType: 'out' as const,
          transactionDate: outItem.issued_at,
          notes: outItem.note,
          remaining: 0, // TODO: 누적 계산 로직 추가
          itemCondition: outItem.item_condition
        })) ?? [])
      ].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

      // 현재 재고가 있는 항목만 필터링 (입고 > 출고)
      const stockInTotal = (stockInData as any)?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
      const stockOutTotal = (stockOutData as any)?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
      const hasStock = stockInTotal > stockOutTotal
      
      if (!hasStock) {
        setStockHistory([])
        setError('현재 재고가 없는 품목입니다.')
        return
      }

      console.log('재고 내역 로드 완료:', allHistory.length, '건')
      setStockHistory(allHistory)
      
    } catch (err) {
      console.error('재고 내역 로드 오류 상세:', err)
      setError('재고 내역을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR')
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-green-600" />
            <span className="text-black">재고 상세 정보</span>
          </DialogTitle>
          <DialogDescription>
            품목의 입출고 내역을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {item ? (
            <>
              {/* 품목 정보 헤더 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 text-black">
                  {item.name} {item.specification && `(${item.specification})`}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">품목 상태:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getItemConditionColor(item.stock_status)}`}>
                      {getItemConditionText(item.stock_status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">현재 재고:</span>
                    <span className="font-medium text-blue-600">{item?.current_quantity || 0}개</span>
                  </div>
                </div>
              </div>

              {/* 재고 내역 테이블 */}
              <div className="space-y-3">
                <h4 className="font-medium text-black">재고 변동 내역</h4>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">재고 내역을 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    <div className="whitespace-pre-line text-sm mb-4">
                      {error}
                    </div>
                    <Button onClick={loadStockHistory} className="mt-2" variant="outline">
                      다시 시도
                    </Button>
                  </div>
                ) : stockHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">날짜</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">구분</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">수량</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">품목상태</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">비고</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">남은 재고</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stockHistory.map((history) => (
                          <tr key={history.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-black">
                              {formatDate(history.transactionDate)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                history.transactionType === 'in' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {history.transactionType === 'in' ? '입고' : '출고'}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <span className={`font-medium ${
                                history.quantity > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {history.quantity > 0 ? '+' : ''}{history.quantity}개
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {history.transactionType === 'in' ? (
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getItemConditionColor(history.itemCondition)}`}>
                                  {getItemConditionText(history.itemCondition)}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-black max-w-xs truncate">
                              {history.notes || '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-black">
                              <span className="font-medium text-blue-600">
                                {history.remaining}개
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>입출고 내역이 없습니다</p>
                    <p className="text-sm text-gray-400 mt-2">데이터베이스 연결 문제로 인해 내역을 불러올 수 없습니다</p>
                  </div>
                )}
              </div>

              {/* 총재고 요약 */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-black">총 재고</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {item?.current_quantity || 0}개
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>품목을 선택해주세요</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline" className="bg-white text-black border border-gray-300 hover:bg-gray-100">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}