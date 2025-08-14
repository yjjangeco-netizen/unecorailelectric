'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Plus } from 'lucide-react'

interface StockInModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
}

export default function StockInModal({ isOpen, onClose, onSave }: StockInModalProps) {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unitPrice: '',
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
            <Package className="h-5 w-5 text-green-600" />
            <span>재고 입고</span>
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
              수량
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
              단가
            </label>
            <input
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              입고 처리
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