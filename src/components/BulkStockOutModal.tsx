'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, ArrowUp } from 'lucide-react'

interface BulkStockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
}

export default function BulkStockOutModal({ isOpen, onClose, onSave }: BulkStockOutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-red-600" />
            <span>대량 출고</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <ArrowUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>대량 출고 기능은 개발 중입니다.</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 