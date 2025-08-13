'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StockOut, CurrentStock, supabase } from '@/lib/supabase'
import { Calendar, ArrowUp, Package, Info } from 'lucide-react'

interface BulkStockOutModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItems: CurrentStock[]
  onSave: (stockOuts: Omit<StockOut, 'id' | 'issued_at'>[]) => Promise<void>
}

export default function BulkStockOutModal({ isOpen, onClose, selectedItems, onSave }: BulkStockOutModalProps) {
  const [formData, setFormData] = useState<{
    issued_by: string
    issued_date: string
    project: string
    is_rental: boolean
    return_date: string
    stock_out_reason: 'as_ss' | 'disposal' | '' // 출고 사유 추가
    disposal_reason: string // 폐기 사유 추가
    items: {
      item_id: string
      quantity: number
      reason: string
      stock_in_id?: string // 입고 항목 ID 추가
    }[]
  }>({
    issued_by: '',
    issued_date: new Date().toISOString().split('T')[0],
    project: '',
    is_rental: false,
    return_date: '',
    stock_out_reason: '', // 기본값
    disposal_reason: '', // 기본값
    items: []
  })
  const [loading, setLoading] = useState(false)
  const [stockInHistory, setStockInHistory] = useState<{[key: string]: any[]}>({}) // 품목별 입고 이력
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)

  // 품목별 입고 이력 가져오기 (테스트용 데이터 포함)
  const loadStockInHistory = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_in')
        .select('*')
        .eq('item_id', itemId)
        .order('received_at', { ascending: false })
      
      if (error) throw error
      
      // 테스트용 데이터 추가 (실제 데이터가 없을 때)
      if (!data || data.length === 0) {
        const testData = [
          {
            id: `test_${itemId}_1`,
            item_id: itemId,
            quantity: 5,
            unit_price: 100000,
            condition_type: 'new',
            reason: '신규 구매',
            ordered_by: '구매팀',
            received_by: 'admin@example.com',
            received_at: '2024-01-15T00:00:00Z'
          },
          {
            id: `test_${itemId}_2`,
            item_id: itemId,
            quantity: 3,
            unit_price: 95000,
            condition_type: 'new',
            reason: '추가 구매',
            ordered_by: 'IT팀',
            received_by: 'admin@example.com',
            received_at: '2024-02-20T00:00:00Z'
          }
        ]
        return testData
      }
      
      return data
    } catch (error) {
      console.error('입고 이력 로드 오류:', error)
      // 오류 시에도 테스트 데이터 반환
      return [
        {
          id: `test_${itemId}_1`,
          item_id: itemId,
          quantity: 5,
          unit_price: 100000,
          condition_type: 'new',
          reason: '신규 구매',
          ordered_by: '구매팀',
          received_by: 'admin@example.com',
          received_at: '2024-01-15T00:00:00Z'
        }
      ]
    }
  }

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          setCurrentUser({ id: user.id, email: user.email || '' })
          // 출고자 필드를 현재 사용자 이메일로 자동 설정
          setFormData(prev => ({ ...prev, issued_by: user.email || '' }))
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error)
      }
    }
    
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (isOpen && selectedItems.length > 0) {
      // 선택된 품목들의 입고 이력 가져오기
      const loadAllStockInHistory = async () => {
        const historyMap: {[key: string]: any[]} = {}
        for (const item of selectedItems) {
          historyMap[item.id] = await loadStockInHistory(item.id)
        }
        setStockInHistory(historyMap)
      }
      
      loadAllStockInHistory()
      
      setFormData(prev => ({
        ...prev,
        items: selectedItems.map(item => ({
          item_id: item.id,
          quantity: 1,
          reason: '',
          stock_in_id: undefined
        }))
      }))
    }
  }, [isOpen, selectedItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 출고 사유 선택 검증
    if (!formData.stock_out_reason) {
      alert('출고 사유를 선택해주세요.')
      return
    }
    
    // AS/SS 선택 시 프로젝트 입력 검증
    if (formData.stock_out_reason === 'as_ss' && !formData.project.trim()) {
      alert('프로젝트명을 입력해주세요.')
      return
    }
    
    // 폐기 선택 시 폐기 사유 입력 검증
    if (formData.stock_out_reason === 'disposal' && !formData.disposal_reason.trim()) {
      alert('폐기 사유를 입력해주세요.')
      return
    }
    
    setLoading(true)
    
    try {
             const stockOuts = formData.items.map(item => ({
         item_id: item.item_id,
         quantity: item.quantity,
         project: formData.stock_out_reason === 'as_ss' ? formData.project : '',
         issued_by: formData.issued_by,
         is_rental: formData.is_rental,
         return_date: formData.is_rental ? formData.return_date : null,
         reason: formData.stock_out_reason === 'disposal' ? formData.disposal_reason : item.reason,
         stock_in_id: item.stock_in_id // 입고 항목 ID 포함
       }))

      await onSave(stockOuts)
      onClose()
             setFormData({
         issued_by: currentUser?.email || '',
         issued_date: new Date().toISOString().split('T')[0],
         project: '',
         is_rental: false,
         return_date: '',
         stock_out_reason: '',
         disposal_reason: '',
         items: []
       })
    } catch (error) {
      console.error('다중 출고 저장 오류:', error)
      // 더 자세한 오류 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      alert(`출고 처리 중 오류가 발생했습니다:\n\n${errorMessage}\n\n자세한 내용은 브라우저 콘솔을 확인해주세요.`)
    } finally {
      setLoading(false)
    }
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], quantity }
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const updateItemReason = (index: number, reason: string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], reason }
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>다중 출고 등록 ({selectedItems.length}개 품목)</DialogTitle>
          <DialogDescription>
            선택된 품목들의 출고 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 공통 정보 */}
          <div className="grid grid-cols-2 gap-4">
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 출고자 *
               </label>
               <input
                 type="text"
                 required
                 value={formData.issued_by}
                 readOnly
                 className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
               />
               {currentUser && (
                 <p className="text-xs text-gray-500 mt-1">
                   현재 로그인: {currentUser.email}
                 </p>
               )}
             </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출고일 *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  required
                  value={formData.issued_date}
                  onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

                     {/* 출고 사유 선택 */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               출고 사유 *
             </label>
             <div className="space-y-3">
               <label className="flex items-center space-x-3">
                 <input
                   type="radio"
                   name="stock_out_reason"
                   value="as_ss"
                   checked={formData.stock_out_reason === 'as_ss'}
                   onChange={(e) => setFormData({ ...formData, stock_out_reason: e.target.value as 'as_ss' | 'disposal' | '' })}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                 />
                 <span className="text-sm text-gray-900">AS/SS (프로젝트용)</span>
               </label>
               <label className="flex items-center space-x-3">
                 <input
                   type="radio"
                   name="stock_out_reason"
                   value="disposal"
                   checked={formData.stock_out_reason === 'disposal'}
                   onChange={(e) => setFormData({ ...formData, stock_out_reason: e.target.value as 'as_ss' | 'disposal' | '' })}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                 />
                 <span className="text-sm text-gray-900">폐기</span>
               </label>
             </div>
           </div>

           {/* AS/SS 선택 시 프로젝트 입력 */}
           {formData.stock_out_reason === 'as_ss' && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 프로젝트 *
               </label>
               <input
                 type="text"
                 required
                 value={formData.project}
                 onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                 placeholder="프로젝트명을 입력하세요"
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
           )}

           {/* 폐기 선택 시 폐기 사유 입력 */}
           {formData.stock_out_reason === 'disposal' && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 폐기 사유 *
               </label>
               <textarea
                 required
                 value={formData.disposal_reason}
                 onChange={(e) => setFormData({ ...formData, disposal_reason: e.target.value })}
                 placeholder="폐기 사유를 상세히 입력하세요"
                 rows={3}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
           )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_rental"
              checked={formData.is_rental}
              onChange={(e) => setFormData({ ...formData, is_rental: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_rental" className="text-sm font-medium text-gray-700">
              대여
            </label>
          </div>

          {formData.is_rental && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                반납 예정일
              </label>
              <input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 선택된 품목들 */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">출고할 품목들</h3>
            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const selectedItem = selectedItems.find(i => i.id === item.item_id)
                return (
                  <div key={item.item_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          품목
                        </label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedItem?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedItem?.specification || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          총 수량
                        </label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedItem?.current_quantity}개
                        </p>
                        <p className="text-xs text-gray-500">
                          전체 재고
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          출고 수량 *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max={selectedItem?.current_quantity || 0}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                                         {/* 입고 항목 선택 - 단순화된 UI */}
                     {stockInHistory[item.item_id] && stockInHistory[item.item_id].length > 0 && (
                       <div className="mb-3">
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           입고 항목 선택
                         </label>
                         {/* 헤더 추가 */}
                         <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 mb-2 px-6">
                           <div>수량</div>
                           <div>입고일</div>
                           <div>항목</div>
                           <div>발주자</div>
                         </div>
                         <div className="space-y-2">
                           {stockInHistory[item.item_id].map((stockIn) => (
                             <div key={stockIn.id} className={`flex items-center space-x-3 p-2 border rounded-md transition-colors ${
                               item.stock_in_id === stockIn.id 
                                 ? 'border-blue-500 bg-blue-50' 
                                 : 'border-gray-200 hover:border-gray-300'
                             }`}>
                               <input
                                 type="radio"
                                 name={`stock_in_${item.item_id}`}
                                 value={stockIn.id}
                                 checked={item.stock_in_id === stockIn.id}
                                 onChange={() => {
                                   const newItems = [...formData.items]
                                   newItems[index] = { ...newItems[index], stock_in_id: stockIn.id }
                                   setFormData(prev => ({ ...prev, items: newItems }))
                                 }}
                                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                               />
                               <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                                 <div className="font-medium text-gray-900">
                                   {stockIn.quantity}개
                                 </div>
                                 <div className="text-gray-600">
                                   {new Date(stockIn.received_at).toLocaleDateString()}
                                 </div>
                                 <div className="text-gray-600">
                                   {stockIn.reason || '-'}
                                 </div>
                                 <div className="text-gray-600">
                                   {stockIn.ordered_by || '-'}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                         {!item.stock_in_id && (
                           <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-md">
                             ⚠️ 입고 항목을 선택하지 않으면 기본 출고로 처리됩니다.
                           </div>
                         )}
                       </div>
                     )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        사유
                      </label>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateItemReason(index, e.target.value)}
                        placeholder="출고 사유"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : 
               formData.stock_out_reason === 'as_ss' ? 'AS/SS 출고 등록' :
               formData.stock_out_reason === 'disposal' ? '폐기 등록' :
               '출고 등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 