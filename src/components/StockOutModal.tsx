'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StockOut, CurrentStock } from '@/lib/supabase'
import { Calendar, Search } from 'lucide-react'

interface StockOutModalProps {
  isOpen: boolean
  onClose: () => void
  stockItems: CurrentStock[]
  onSave: (stockOut: Omit<StockOut, 'id' | 'issued_at'>) => Promise<void>
}

export default function StockOutModal({ isOpen, onClose, stockItems, onSave }: StockOutModalProps) {
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: 0,
    project: '',
    issued_by: '',
    is_rental: false,
    return_date: '',
    issued_date: new Date().toISOString().split('T')[0] // 오늘 날짜 기본값
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<CurrentStock[]>([])

  useEffect(() => {
    if (stockItems.length > 0 && !formData.item_id) {
      setFormData(prev => ({ ...prev, item_id: stockItems[0].id }))
    }
  }, [stockItems, formData.item_id])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = stockItems.filter(item => 
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.specification?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.maker?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [searchTerm, stockItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSave({
        ...formData,
        issued_at: new Date(formData.issued_date).toISOString()
      })
      onClose()
      setFormData({
        item_id: '',
        quantity: 0,
        project: '',
        issued_by: '',
        is_rental: false,
        return_date: '',
        issued_date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('출고 저장 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = stockItems.find(item => item.id === formData.item_id)
  const displayItems = searchTerm.trim() ? filteredItems : stockItems

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>출고 등록</DialogTitle>
          <DialogDescription>
            선택된 품목을 출고합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              품목 *
            </label>
            
            {/* 검색 입력 */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="품명, 규격, 메이커, 용도로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              required
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">품목을 선택하세요</option>
              {displayItems
                .filter(item => item.current_quantity > 0)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (재고: {item.current_quantity}개)
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수량 *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedItem?.current_quantity || 0}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트
            </label>
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출고자 *
            </label>
            <input
              type="text"
              required
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          {selectedItem && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>선택된 품목:</strong> {selectedItem.name}
                <br />
                <strong>현재 재고:</strong> {selectedItem.current_quantity}개
                <br />
                <strong>단가:</strong> {selectedItem.unit_price.toLocaleString()}원
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '출고 등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 