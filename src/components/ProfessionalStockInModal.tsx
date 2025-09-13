'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Plus, Search, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ProfessionalStockItem, StockHistory } from '@/lib/types'

interface ProfessionalStockInModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function ProfessionalStockInModal({ isOpen, onClose, onSave }: ProfessionalStockInModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    specification: '',
    maker: '',
    location: '',
    unitPrice: 0,
    stockStatus: 'new' as 'new' | 'used-new' | 'used-used' | 'broken',
    remark: '',
    quantity: 0,
    eventDate: new Date().toISOString().split('T')[0] || '',
    note: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [existingItems, setExistingItems] = useState<ProfessionalStockItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewItem, setIsNewItem] = useState(true)
  const [selectedExistingItem, setSelectedExistingItem] = useState<ProfessionalStockItem | null>(null)

  // 기존 품목 검색
  const searchExistingItems = async (query: string) => {
    if (!query.trim()) {
      setExistingItems([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .or(`name.ilike.%${query}%,specification.ilike.%${query}%,maker.ilike.%${query}%`)
        .limit(10)

      if (error) throw error
      setExistingItems(data || [])
    } catch (error) {
      console.error('품목 검색 오류:', error)
    }
  }

  // 기존 품목 선택
  const selectExistingItem = (item: ProfessionalStockItem) => {
    setSelectedExistingItem(item)
    setFormData({
      ...formData,
      name: item.name,
      specification: item.specification || '',
      maker: item.maker || '',
      location: item.location || '',
      unitPrice: item.unit_price,
      stockStatus: item.stock_status as 'new' | 'used-new' | 'used-used' | 'broken',
      remark: item.note || ''
    })
    setIsNewItem(false)
    setExistingItems([])
    setSearchQuery('')
  }

  // 새 품목 등록 모드
  const enableNewItemMode = () => {
    setIsNewItem(true)
    setSelectedExistingItem(null)
    setFormData({
      name: '',
      specification: '',
      maker: '',
      location: '',
      unitPrice: 0,
      stockStatus: 'new',
      remark: '',
      quantity: 0,
      eventDate: new Date().toISOString().split('T')[0] || '',
      note: ''
    })
  }

  // 전문적인 입고 처리
  const handleProfessionalStockIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let itemId: number

      if (isNewItem) {
        // 1. 새 품목 등록
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            product: formData.name,
            spec: formData.specification,
            maker: formData.maker,
            location: formData.location,
            unit_price: formData.unitPrice,
            stock_status: formData.stockStatus,
            note: formData.remark
          })
          .select()
          .single()

        if (itemError) {
          throw new Error(`품목 등록 실패: ${itemError.message}`)
        }

        itemId = newItem.id
      } else {
        // 기존 품목 사용
        itemId = selectedExistingItem!.id
      }

      // 2. 입고 이력 기록
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          item_id: itemId,
          event_type: 'IN',
          quantity: formData.quantity,
          event_date: formData.eventDate,
          condition_type: formData.stockStatus,
          notes: formData.note
        })

      if (historyError) {
        throw new Error(`입고 이력 기록 실패: ${historyError.message}`)
      }

      alert('전문적인 입고가 성공적으로 처리되었습니다!')
      onSave()
      onClose()

    } catch (error) {
      console.error('전문적인 입고 처리 오류:', error)
      alert(`입고 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 폼 초기화
  const handleClose = () => {
    setFormData({
      name: '',
      specification: '',
      maker: '',
      location: '',
      unitPrice: 0,
      stockStatus: 'new',
      remark: '',
      quantity: 0,
      eventDate: new Date().toISOString().split('T')[0] || '',
      note: ''
    })
    setExistingItems([])
    setSearchQuery('')
    setIsNewItem(true)
    setSelectedExistingItem(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="text-black">전문적인 재고 입고 시스템</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleProfessionalStockIn} className="space-y-6">
          {/* 기존 품목 검색 섹션 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">기존 품목 검색</span>
            </div>
            
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchExistingItems(e.target.value)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="품목명, 규격, 제조사로 검색..."
              />
              <Button
                type="button"
                onClick={enableNewItemMode}
                variant="outline"
                className="bg-white text-black border border-gray-300 hover:bg-gray-100"
              >
                새 품목 등록
              </Button>
            </div>

            {/* 검색 결과 */}
            {existingItems.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-white">
                {existingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => selectExistingItem(item)}
                    className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-black">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.specification && `규격: ${item.specification}`} {item.maker && `| 제조사: ${item.maker}`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 선택된 기존 품목 표시 */}
            {selectedExistingItem && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">선택된 품목</span>
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  {selectedExistingItem.name} | {selectedExistingItem.specification || '규격 없음'} | {selectedExistingItem.maker || '제조사 없음'}
                </div>
              </div>
            )}
          </div>

          {/* 품목 정보 입력 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                품목명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="품목명을 입력하세요"
                required
                disabled={!isNewItem}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                규격
              </label>
              <input
                type="text"
                value={formData.specification}
                onChange={(e) => setFormData({...formData, specification: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="규격을 입력하세요"
                disabled={!isNewItem}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                제조사
              </label>
              <input
                type="text"
                value={formData.maker}
                onChange={(e) => setFormData({...formData, maker: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="제조사를 입력하세요"
                disabled={!isNewItem}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                위치
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="창고 위치를 입력하세요"
                disabled={!isNewItem}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  // 최대값 제한 (INTEGER 범위: 2,147,483,647)
                  if (value > 2147483647) {
                    alert('수량은 2,147,483,647개를 초과할 수 없습니다.')
                    return
                  }
                  setFormData({...formData, quantity: value})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="0"
                min="1"
                max="2147483647"
                required
                disabled={!isNewItem}
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 수량: 2,147,483,647개
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                단가 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  // 최대값 제한 (DECIMAL(15,2) 범위: 999,999,999,999.99)
                  if (value > 999999999999.99) {
                    alert('단가는 999,999,999,999.99원을 초과할 수 없습니다.')
                    return
                  }
                  setFormData({...formData, unitPrice: value})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="0"
                min="0"
                max="999999999999.99"
                step="0.01"
                required
                disabled={!isNewItem}
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 단가: 999,999,999,999.99원
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                재고 상태 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stockStatus}
                onChange={(e) => setFormData({...formData, stockStatus: e.target.value as 'new' | 'used-new' | 'used-used' | 'broken'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                disabled={!isNewItem}
                required
              >
                <option value="new">신품</option>
                <option value="used-new">중고신품</option>
                <option value="used-used">중고사용품</option>
                <option value="broken">불량품</option>
              </select>
            </div>
          </div>

          {/* 입고 정보 입력 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                입고일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                required
              />
            </div>
          </div>

          {/* 비고 및 품목 설명 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                품목 설명
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                rows={3}
                placeholder="품목에 대한 설명을 입력하세요"
                disabled={!isNewItem}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                입고 비고
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                rows={3}
                placeholder="입고에 대한 메모를 입력하세요"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSaving ? '처리 중...' : '전문적인 입고 처리'}
            </Button>
            <Button 
              type="button" 
              onClick={handleClose} 
              variant="outline" 
              className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
