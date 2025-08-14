'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface DisposalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
}

export default function DisposalModal({ isOpen, onClose, onSave }: DisposalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>폐기 처리</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>폐기 처리 기능은 개발 중입니다.</p>
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