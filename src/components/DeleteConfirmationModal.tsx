'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemCount: number
  isDeleting?: boolean
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemCount,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-2xl" aria-describedby="delete-description">
        <div className="bg-red-50/50 px-8 py-6 border-b border-red-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-red-950">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              삭제 확인
            </DialogTitle>
            <p id="delete-description" className="text-red-600/80 mt-2 text-sm font-medium">
              선택한 항목을 영구적으로 삭제합니다.
            </p>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-4">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-red-900">정말 삭제하시겠습니까?</h4>
              <p className="text-sm text-red-700 leading-relaxed">
                선택하신 <span className="font-bold underline">{itemCount}개</span>의 항목이 시스템에서 영구적으로 제거됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isDeleting}
              className="flex-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all"
            >
              취소
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 rounded-xl font-bold transition-all"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  삭제 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  삭제하기
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
