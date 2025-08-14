'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, List } from 'lucide-react'

interface StockInListModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StockInListModal({ isOpen, onClose }: StockInListModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <List className="h-5 w-5 text-green-600" />
            <span>입고 이력</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>입고 이력 조회 기능은 개발 중입니다.</p>
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