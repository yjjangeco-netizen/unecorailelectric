'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, X } from "lucide-react"

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
      <DialogContent className="sm:max-w-xl bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-2xl" aria-describedby="disposal-description">
        {/* Header Section */}
        <div className="bg-orange-50/50 px-8 py-6 border-b border-orange-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-orange-950">
              <div className="p-2.5 bg-orange-100 rounded-xl">
                <Trash2 className="h-6 w-6 text-orange-600" />
              </div>
              재고 폐기 처리
            </DialogTitle>
            <p id="disposal-description" className="text-orange-600/80 mt-2 text-sm font-medium">
              손상되거나 유효기간이 만료된 자재를 폐기 처리합니다.
            </p>
          </DialogHeader>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* 선택된 항목 리스트 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                선택된 품목 ({itemsToDispose.length}개)
              </h4>
              
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar border border-orange-100 rounded-xl p-1 bg-orange-50/30">
                {itemsToDispose.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 m-1 bg-white rounded-lg shadow-sm border border-orange-100/50">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-bold text-gray-900 truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">현재 재고: {item.currentStock}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label htmlFor={`qty-${item.id}`} className="text-xs font-medium text-gray-500">폐기수량:</label>
                      <input
                        id={`qty-${item.id}`}
                        type="number"
                        min="1"
                        max={item.currentStock}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-20 px-3 py-1.5 bg-gray-50 border-transparent focus:bg-white border focus:border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500/10 transition-all text-right font-medium text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 폐기 사유 입력 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                폐기 사유 <span className="text-red-500">*</span>
              </label>
              <input
                id="reason"
                placeholder="예: 파손, 유효기간 만료, 불량 등"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-orange-500 rounded-xl focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 font-medium"
              />
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="flex-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || itemsToDispose.length === 0}
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 rounded-xl font-bold transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    처리 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    폐기 확정
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}