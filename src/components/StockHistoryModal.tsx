'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { History, Package } from 'lucide-react'

interface StockHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  item?: { 
    id: string
    name: string
    specification?: string
    current_quantity?: number
  } | null
}

export default function StockHistoryModal({ isOpen, onClose, item }: StockHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <span>재고 이력</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {item ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">품목 정보</h3>
              <p><strong>품명:</strong> {item.name}</p>
              <p><strong>규격:</strong> {item.specification || '-'}</p>
              <p><strong>현재 재고:</strong> {item?.current_quantity || 0}개</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>품목을 선택해주세요</p>
            </div>
          )}

          <div className="text-center py-4">
            <p className="text-gray-500">이력 조회 기능은 개발 중입니다.</p>
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