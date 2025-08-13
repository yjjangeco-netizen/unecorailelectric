'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StockIn, Item, Disposal } from '@/lib/supabase'

interface DisposalModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItemIds: string[]
  onDisposalComplete: () => void
}

interface StockInWithItem extends StockIn {
  item: Item
}

export default function DisposalModal({ isOpen, onClose, selectedItemIds, onDisposalComplete }: DisposalModalProps) {
  const [stockInHistory, setStockInHistory] = useState<StockInWithItem[]>([])
  const [loading, setLoading] = useState(false)
  const [disposalForm, setDisposalForm] = useState({
    disposed_by: '',
    reason: '',
    notes: ''
  })
  const [disposalItems, setDisposalItems] = useState<{
    stock_in_id: string
    item_id: string
    quantity: number
    max_quantity: number
    item_name: string
    received_at: string
  }[]>([])

  useEffect(() => {
    if (isOpen && selectedItemIds.length > 0) {
      loadStockInHistory()
    }
  }, [isOpen, selectedItemIds])

  const loadStockInHistory = async () => {
    try {
      setLoading(true)
      
      // 선택된 아이템들의 입고 이력을 로드
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          *,
          item:items (
            id,
            name,
            specification,
            maker
          )
        `)
        .in('item_id', selectedItemIds)
        .order('received_at', { ascending: false })

      if (error) throw error

      const history = data || []
      setStockInHistory(history)

      // 폐기 가능한 수량 계산 (이미 폐기된 수량 제외)
      const disposalItemsData = await Promise.all(
        history.map(async (stockIn) => {
          // 이미 폐기된 수량 조회
          const { data: disposedData } = await supabase
            .from('disposal')
            .select('quantity')
            .eq('stock_in_id', stockIn.id)

          const disposedQuantity = disposedData?.reduce((sum, d) => sum + d.quantity, 0) || 0
          const availableQuantity = stockIn.quantity - disposedQuantity

          return {
            stock_in_id: stockIn.id,
            item_id: stockIn.item_id,
            quantity: 0,
            max_quantity: availableQuantity,
            item_name: stockIn.item.name,
            received_at: stockIn.received_at
          }
        })
      )

      setDisposalItems(disposalItemsData.filter(item => item.max_quantity > 0))
    } catch (error) {
      console.error('입고 이력 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (stockInId: string, quantity: number) => {
    setDisposalItems(prev => 
      prev.map(item => 
        item.stock_in_id === stockInId 
          ? { ...item, quantity: Math.min(Math.max(0, quantity), item.max_quantity) }
          : item
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!disposalForm.disposed_by.trim()) {
      alert('폐기자를 입력해주세요.')
      return
    }

    const itemsToDispose = disposalItems.filter(item => item.quantity > 0)
    if (itemsToDispose.length === 0) {
      alert('폐기할 수량을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const disposalRecords = itemsToDispose.map(item => ({
        stock_in_id: item.stock_in_id,
        item_id: item.item_id,
        quantity: item.quantity,
        disposed_by: disposalForm.disposed_by,
        reason: disposalForm.reason,
        notes: disposalForm.notes
      }))

      const { error } = await supabase
        .from('disposal')
        .insert(disposalRecords)

      if (error) throw error

      alert('폐기 처리가 완료되었습니다.')
      onDisposalComplete()
      onClose()
    } catch (error) {
      console.error('폐기 처리 오류:', error)
      alert('폐기 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setDisposalForm({
      disposed_by: '',
      reason: '',
      notes: ''
    })
    setDisposalItems(prev => prev.map(item => ({ ...item, quantity: 0 })))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            품목 폐기
          </DialogTitle>
          <DialogDescription>
            선택된 품목의 입고 이력을 확인하고 폐기할 수량을 지정하세요.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 폐기 정보 입력 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">폐기 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    폐기자 *
                  </label>
                  <input
                    type="text"
                    required
                    value={disposalForm.disposed_by}
                    onChange={(e) => setDisposalForm({ ...disposalForm, disposed_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="폐기자명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    폐기 사유
                  </label>
                  <input
                    type="text"
                    value={disposalForm.reason}
                    onChange={(e) => setDisposalForm({ ...disposalForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="폐기 사유를 입력하세요"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고
                </label>
                <textarea
                  value={disposalForm.notes}
                  onChange={(e) => setDisposalForm({ ...disposalForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="추가 메모를 입력하세요"
                />
              </div>
            </div>

            {/* 입고 이력 및 폐기 수량 지정 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">입고 이력 및 폐기 수량</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고수량</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기가능</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기수량</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {disposalItems.map((item) => (
                      <tr key={item.stock_in_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.received_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.max_quantity + (item.quantity || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="text-green-600 font-medium">{item.max_quantity}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="number"
                            min="0"
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.stock_in_id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            disabled={item.max_quantity === 0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {disposalItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>폐기 가능한 입고 이력이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                초기화
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading || disposalItems.filter(item => item.quantity > 0).length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? '처리 중...' : '폐기 처리'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 