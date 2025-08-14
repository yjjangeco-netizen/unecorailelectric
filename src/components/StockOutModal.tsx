'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, ArrowUp, AlertTriangle } from 'lucide-react'

interface StockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  selectedItems?: Array<{ id: string; name: string; current_quantity: number }>
}

export default function StockOutModal({ isOpen, onClose, onSave, selectedItems = [] }: StockOutModalProps) {
  const [formData, setFormData] = useState({
    quantity: '',
    project: '',
    notes: ''
  })

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        quantity: '',
        project: '',
        notes: ''
      })
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedItems.length === 0) {
      alert('출고할 항목을 선택해주세요.')
      return
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      alert('출고 수량을 입력해주세요.')
      return
    }

    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-red-600" />
            <span>재고 출고</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 선택된 항목 표시 */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900 mb-2">
                선택된 항목 ({selectedItems.length}개)
              </div>
              <div className="space-y-1">
                {selectedItems.map((item) => (
                  <div key={item.id} className="text-xs text-blue-700 flex justify-between">
                    <span>{item.name}</span>
                    <span>현재: {item.current_quantity}개</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedItems.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">출고할 항목을 선택해주세요</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출고 수량
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="출고할 수량을 입력하세요"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트/용도
            </label>
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({...formData, project: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로젝트명 또는 용도를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비고
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="추가 메모를 입력하세요"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={selectedItems.length === 0}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              출고 처리
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 