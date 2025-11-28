'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle } from "lucide-react"


interface StockItem {
  id: string
  name: string
  currentStock: number
  [key: string]: any
}

interface DisposalModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItems: string[]
  stockItems: StockItem[]
  onSuccess: () => void
}

export default function DisposalModal({ isOpen, onClose, selectedItems, stockItems, onSuccess }: DisposalModalProps) {
  const [itemsToDispose, setItemsToDispose] = useState<{ id: string; name: string; currentStock: number; quantity: number }[]>([])
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && selectedItems.length > 0) {
      const items = stockItems
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          id: item.id,
          name: item.name,
          currentStock: item.currentStock,
          quantity: 1 // Default disposal quantity
        }))
      setItemsToDispose(items)
      setReason('')
      setError(null)
    }
  }, [isOpen, selectedItems, stockItems])

  const handleQuantityChange = (id: string, qty: string) => {
    const quantity = parseInt(qty) || 0
    setItemsToDispose(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ))
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('폐기 사유를 입력해주세요.')
      return
    }

    if (itemsToDispose.some(item => item.quantity <= 0)) {
      setError('폐기 수량은 1개 이상이어야 합니다.')
      return
    }

    if (itemsToDispose.some(item => item.quantity > item.currentStock)) {
      setError('폐기 수량이 현재 재고보다 많을 수 없습니다.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/stock/disposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}` // Assuming token is in localStorage
        },
        body: JSON.stringify({
          items: itemsToDispose.map(item => ({
            id: item.id,
            quantity: item.quantity,
            reason: reason
          }))
        })
      })

      const data = await response.json()

      if (data.ok) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || '폐기 처리에 실패했습니다.')
      }
    } catch (err) {
      console.error('Disposal error:', err)
      setError('폐기 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <span>재고 폐기 처리</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>선택된 품목 ({itemsToDispose.length}개)</Label>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-2">
              {itemsToDispose.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">현재 재고: {item.currentStock}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`qty-${item.id}`} className="text-xs">수량:</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      max={item.currentStock}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="w-20 h-8 text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">폐기 사유 <span className="text-red-500">*</span></Label>
            <Input
              id="reason"
              placeholder="예: 파손, 유효기간 만료, 불량 등"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || itemsToDispose.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? '처리 중...' : '폐기 처리'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}