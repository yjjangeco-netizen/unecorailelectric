'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StockIn, Item, supabase } from '@/lib/supabase'
import { Calendar, Package, Info } from 'lucide-react'

interface StockInModalProps {
  isOpen: boolean
  onClose: () => void
  items: Item[]
  onSave: (stockIn: Omit<StockIn, 'id' | 'received_at'>) => Promise<void>
}

export default function StockInModal({ isOpen, onClose, items, onSave }: StockInModalProps) {
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: 0,
    unit_price: 0,
    condition_type: 'new' as const,
    reason: '',
    ordered_by: '',
    received_by: '',
    received_date: new Date().toISOString().split('T')[0] // 오늘 날짜 기본값
  })
  const [loading, setLoading] = useState(false)
  const [existingItem, setExistingItem] = useState<Item | null>(null)
  const [showMergeOption, setShowMergeOption] = useState(false)
  const [mergeConfirmed, setMergeConfirmed] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          setCurrentUser({ id: user.id, email: user.email || '' })
          // 입고자 필드를 현재 사용자 이메일로 자동 설정
          setFormData(prev => ({ ...prev, received_by: user.email || '' }))
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error)
      }
    }
    
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (items.length > 0 && !formData.item_id) {
      setFormData(prev => ({ ...prev, item_id: items[0].id }))
    }
  }, [items, formData.item_id])

  // 품목 선택 시 기존 품목 정보 확인
  useEffect(() => {
    if (formData.item_id) {
      const selected = items.find(item => item.id === formData.item_id)
      if (selected) {
        setExistingItem(selected)
        // 기존 품목이 있으면 합치기 옵션 표시
        setShowMergeOption(true)
        setMergeConfirmed(false)
      }
    }
  }, [formData.item_id, items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSave({
        ...formData,
        received_at: new Date(formData.received_date).toISOString()
      })
      onClose()
             setFormData({
         item_id: '',
         quantity: 0,
         unit_price: 0,
         condition_type: 'new',
         reason: '',
         ordered_by: '',
         received_by: currentUser?.email || '',
         received_date: new Date().toISOString().split('T')[0]
       })
    } catch (error) {
      console.error('입고 저장 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = items.find(item => item.id === formData.item_id)

  // 품목 합치기 시 단가 자동 계산
  useEffect(() => {
    if (mergeConfirmed && existingItem && formData.quantity > 0) {
      const currentTotal = (existingItem.unit_price || 0) * (existingItem.current_quantity || 0)
      const newTotal = formData.unit_price * formData.quantity
      const totalQuantity = (existingItem.current_quantity || 0) + formData.quantity
      const averagePrice = totalQuantity > 0 ? (currentTotal + newTotal) / totalQuantity : 0
      
      setFormData(prev => ({ ...prev, unit_price: Math.round(averagePrice) }))
    }
  }, [mergeConfirmed, existingItem, formData.quantity, formData.unit_price])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>입고 등록</DialogTitle>
          <DialogDescription>
            새로운 품목을 입고하거나 기존 품목의 수량을 추가합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              품목 *
            </label>
            <select
              required
              value={formData.item_id}
              onChange={(e) => {
                const item = items.find(i => i.id === e.target.value)
                setFormData({
                  ...formData,
                  item_id: e.target.value,
                  unit_price: item?.unit_price || 0
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">품목을 선택하세요</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.description}
                </option>
              ))}
            </select>
          </div>

          {/* 기존 품목 정보 및 합치기 옵션 */}
          {showMergeOption && existingItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    기존 품목이 발견되었습니다
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>품명:</strong> {existingItem.name}</p>
                    <p><strong>현재 단가:</strong> {existingItem.unit_price?.toLocaleString()}원</p>
                    <p><strong>규격:</strong> {existingItem.specification || '-'}</p>
                    <p><strong>메이커:</strong> {existingItem.maker || '-'}</p>
                  </div>
                  <div className="mt-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={mergeConfirmed}
                        onChange={(e) => setMergeConfirmed(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-blue-900">
                        기존 품목과 합치시겠습니까? (수량과 단가가 합쳐집니다)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수량 *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단가 *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 *
              </label>
              <select
                required
                value={formData.condition_type}
                onChange={(e) => setFormData({ ...formData, condition_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">신품</option>
                <option value="used_good">중고(양품)</option>
                <option value="used_defective">중고(불량)</option>
                <option value="unknown">모름</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                입고일 *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  required
                  value={formData.received_date}
                  onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              입고 사유
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발주자
              </label>
              <input
                type="text"
                value={formData.ordered_by}
                onChange={(e) => setFormData({ ...formData, ordered_by: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 입고자 *
               </label>
               <input
                 type="text"
                 required
                 value={formData.received_by}
                 readOnly
                 className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
               />
               {currentUser && (
                 <p className="text-xs text-gray-500 mt-1">
                   현재 로그인: {currentUser.email}
                 </p>
               )}
             </div>
          </div>

          {selectedItem && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>선택된 품목:</strong> {selectedItem.name}
                <br />
                <strong>현재 단가:</strong> {selectedItem.unit_price.toLocaleString()}원
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '입고 등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 