'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, ArrowUp, AlertTriangle } from 'lucide-react'

// 엄격한 타입 정의
interface StockOutFormData {
  itemId: string
  itemName: string
  spec: string
  currentQuantity: number
  requestQuantity: number
  unitPrice: number
  totalAmount: number
  project: string
  notes: string
  isRental: boolean
  returnDate: string
}

interface StockOutItem {
  id: string
  product: string
  spec: string
  current_quantity: number
  closing_quantity: number
  unit_price: number
  location: string
}

interface StockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: StockOutFormData) => void
  selectedItems: StockOutItem[]
}

export default function StockOutModal({ isOpen, onClose, onSave, selectedItems = [] }: StockOutModalProps) {
  const [formData, setFormData] = useState<StockOutFormData>({
    itemId: '',
    itemName: '',
    spec: '',
    currentQuantity: 0,
    requestQuantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    project: '',
    notes: '',
    isRental: false,
    returnDate: ''
  })

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        itemId: '',
        itemName: '',
        spec: '',
        currentQuantity: 0,
        requestQuantity: 1,
        unitPrice: 0,
        totalAmount: 0,
        project: '',
        notes: '',
        isRental: false,
        returnDate: ''
      })
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedItems.length === 0) {
      alert('출고할 항목을 선택해주세요.')
      return
    }

    if (!formData.requestQuantity || formData.requestQuantity <= 0) {
      alert('출고 수량을 입력해주세요.')
      return
    }

    // 선택된 항목들의 재고 수량 검증
    const outQuantity = formData.requestQuantity
    const insufficientItems = selectedItems.filter(item => {
      // closing_quantity가 있으면 그것을 사용, 없으면 current_quantity 사용
      const availableQuantity = item.closing_quantity || item.current_quantity
      return availableQuantity < outQuantity
    })
    
    if (insufficientItems.length > 0) {
      const itemNames = insufficientItems.map(item => item.product).join(', ')
      alert(`재고 부족: ${itemNames}\n출고 수량을 재고 수량 이하로 조정해주세요.`)
      return
    }

    onSave(formData)
    onClose()
  }

  // 폼 초기화 및 모달 닫기
  const handleClose = () => {
    setFormData({
      itemId: '',
      itemName: '',
      spec: '',
      currentQuantity: 0,
      requestQuantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      project: '',
      notes: '',
      isRental: false,
      returnDate: ''
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-50" aria-describedby="stock-out-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-red-600" />
            <span className="text-2xl font-bold text-black">재고 출고</span>
          </DialogTitle>
          <p id="stock-out-description" className="text-gray-600 mt-1">
            선택된 재고를 출고 처리합니다.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 선택된 항목 표시 */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-3">
                선택된 항목 ({selectedItems.length}개)
              </div>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="text-sm text-blue-700 flex justify-between items-center p-2 bg-blue-100 rounded">
                    <span className="font-medium">{item.product}</span>
                    <span className="text-blue-600 font-bold">현재: {item.closing_quantity || item.current_quantity}개</span>
                    <span className="text-blue-600 font-bold">위치: {item.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedItems.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">출고할 항목을 선택해주세요</span>
              </div>
            </div>
          )}

          {/* 필수 필드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                출고 수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.requestQuantity}
                onChange={(e) => setFormData({...formData, requestQuantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="출고할 수량을 입력하세요"
                min="1"
                max="999999"
                required
              />
              {selectedItems.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  최대 출고 가능: {Math.min(...selectedItems.map(item => item.closing_quantity || item.current_quantity))}개
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                프로젝트/용도
              </label>
              <input
                type="text"
                value={formData.project}
                onChange={(e) => setFormData({...formData, project: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="프로젝트명 또는 용도를 입력하세요"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              비고
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
              rows={3}
              placeholder="추가 메모를 입력하세요"
              maxLength={500}
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
              disabled={selectedItems.length === 0}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              출고 처리
            </Button>
            <Button type="button" onClick={handleClose} variant="outline" className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100">
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 