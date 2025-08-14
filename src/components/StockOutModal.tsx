'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, ArrowUp } from 'lucide-react'

interface StockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
}

export default function StockOutModal({ isOpen, onClose, onSave }: StockOutModalProps) {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    project: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              품목명
            </label>
            <input
              type="text"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출고 수량
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
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