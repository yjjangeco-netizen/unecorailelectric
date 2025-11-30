'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, ArrowUp, AlertTriangle, X } from 'lucide-react'

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
      <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-2xl" aria-describedby="stock-out-description">
        {/* Header Section */}
        <div className="bg-rose-50/50 px-8 py-6 border-b border-rose-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-rose-950">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Package className="h-6 w-6 text-rose-600" />
              </div>
              재고 출고
            </DialogTitle>
            <p id="stock-out-description" className="text-rose-600/80 mt-2 text-sm font-medium">
              선택된 자재를 출고 처리하고 재고에서 차감합니다.
            </p>
          </DialogHeader>
        </div>
        
        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 선택된 항목 표시 */}
            {selectedItems.length > 0 ? (
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    선택된 항목 ({selectedItems.length}개)
                  </h4>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-rose-100 shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{item.product}</span>
                        <span className="text-xs text-gray-500">{item.spec}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                          현재: {item.closing_quantity || item.current_quantity}개
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          위치: {item.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-yellow-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">출고할 항목을 먼저 선택해주세요.</span>
              </div>
            )}

            {/* 입력 필드 그룹 */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                출고 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    출고 수량 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.requestQuantity}
                    onChange={(e) => setFormData({...formData, requestQuantity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-rose-500 rounded-xl focus:ring-4 focus:ring-rose-500/10 transition-all duration-200 font-medium"
                    placeholder="0"
                    min="1"
                    max="999999"
                    required
                  />
                  {selectedItems.length > 0 && (
                    <p className="text-xs text-rose-500 font-medium mt-1 ml-1">
                      최대 가능: {Math.min(...selectedItems.map(item => item.closing_quantity || item.current_quantity))}개
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    프로젝트/용도
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-rose-500 rounded-xl focus:ring-4 focus:ring-rose-500/10 transition-all duration-200 font-medium"
                    placeholder="용도를 입력하세요"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  비고
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-rose-500 rounded-xl focus:ring-4 focus:ring-rose-500/10 transition-all duration-200 font-medium resize-none"
                  rows={3}
                  placeholder="추가 메모를 입력하세요"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                onClick={handleClose} 
                variant="outline" 
                className="flex-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 rounded-xl font-bold transition-all"
                disabled={selectedItems.length === 0}
              >
                <ArrowUp className="h-5 w-5 mr-2" />
                출고 처리
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}