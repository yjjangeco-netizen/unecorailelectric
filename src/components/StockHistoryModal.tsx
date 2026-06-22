'use client'

import { useState, useEffect, useCallback } from 'react'
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
  handler: string
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

  const loadStockHistory = useCallback(async () => {
    if (!item?.id) {
      console.error('품목 ID가 없습니다:', item)
      setError('품목 ID가 없습니다.')
      return
    }

    // ID 형식 검증 - UUID 또는 숫자 ID 모두 허용
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const numericIdRegex = /^\d+$/
    
    if (!uuidRegex.test(item.id) && !numericIdRegex.test(item.id)) {
      console.error('잘못된 ID 형식:', item.id)
      setError(`잘못된 품목 ID 형식입니다: ${item.id}`)
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('stock_history')
        .select('*')
        .eq('item_id', item.id)
        .order('event_date', { ascending: false })

      if (historyError) {
        console.error('재고 이력 조회 오류:', historyError)
        throw new Error(`재고 이력 조회 실패: ${historyError.message}`)
      }

      let runningRemaining = item.current_quantity || 0
      const allHistory = ((historyData as any) ?? []).map((history: any) => {
        const isIn = String(history.event_type).toUpperCase() === 'IN'
        const signedQuantity = isIn ? history.quantity : -history.quantity
        const rowRemaining = runningRemaining
        runningRemaining -= signedQuantity

        return {
          id: history.id,
          itemName: item.name || '',
          spec: item.specification || '',
          maker: item.maker || '',
          purpose: item.purpose || history.reason || '',
          unitPrice: history.unit_price || item.unit_price || 0,
          quantity: signedQuantity,
          totalAmount: (history.quantity || 0) * (history.unit_price || item.unit_price || 0),
          transactionType: isIn ? 'in' as const : 'out' as const,
          transactionDate: history.event_date || history.created_at,
          notes: history.notes || history.reason || history.disposal_reason || '',
          remaining: rowRemaining,
          itemCondition: history.condition_type,
          handler: history.received_by || history.ordered_by || history.requester || '-'
        }
      })
      
      if (allHistory.length === 0) {
        setStockHistory([])
        setError('입출고 내역이 없습니다.')
        return
      }

      setStockHistory(allHistory)
      
    } catch (err) {
      console.error('재고 내역 로드 오류 상세:', err)
      setError('재고 내역을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [item])

  useEffect(() => {
    if (item && isOpen) {
      loadStockHistory()
    }
  }, [item, isOpen, loadStockHistory])

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
                          <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">처리자</th>
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
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-black">
                              {history.handler}
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
