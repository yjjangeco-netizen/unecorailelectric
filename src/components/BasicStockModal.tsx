'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, X, Save, Plus, Minus } from 'lucide-react'

interface BasicStockItem {
  id: string
  name: string
  location: string
  specification: string
  material: string
  unit: string
  quantity: number
  notes: string
}

interface BasicStockModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (items: BasicStockItem[]) => void
  existingItems?: BasicStockItem[]
}

export default function BasicStockModal({ 
  isOpen, 
  onClose, 
  onSave, 
  existingItems = [] 
}: BasicStockModalProps) {
  const [items, setItems] = useState<BasicStockItem[]>(existingItems)
  const [newItem, setNewItem] = useState<Partial<BasicStockItem>>({
    name: '',
    location: '',
    specification: '',
    material: '',
    unit: '',
    quantity: 0,
    notes: ''
  })

  const handleAddItem = () => {
    if (!newItem.name || !newItem.location) {
      alert('품명과 위치는 필수 입력 항목입니다.')
      return
    }

    const item: BasicStockItem = {
      id: Date.now().toString(),
      name: newItem.name,
      location: newItem.location,
      specification: newItem.specification || '',
      material: newItem.material || '',
      unit: newItem.unit || '',
      quantity: newItem.quantity || 0,
      notes: newItem.notes || ''
    }

    setItems(prev => [...prev, item])
    setNewItem({
      name: '',
      location: '',
      specification: '',
      material: '',
      unit: '',
      quantity: 0,
      notes: ''
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleQuantityChange = (id: string, change: number) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ))
  }

  const handleSave = () => {
    if (items.length === 0) {
      alert('기초재고 항목을 추가해주세요.')
      return
    }
    onSave(items)
    onClose()
  }

  if (!isOpen) {return null}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-blue-900">
              <Package className="h-5 w-5 mr-2" />
              기초재고 입력
            </CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 새 항목 추가 폼 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">새 항목 추가</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="품명 *"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="위치 *"
                value={newItem.location}
                onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="규격"
                value={newItem.specification || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, specification: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="재질"
                value={newItem.material}
                onChange={(e) => setNewItem(prev => ({ ...prev, material: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="단위"
                value={newItem.unit}
                onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="수량"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="비고"
                value={newItem.notes}
                onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <Button
              onClick={handleAddItem}
              className="mt-3 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              항목 추가
            </Button>
          </div>

          {/* 기초재고 목록 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              기초재고 목록 ({items.length}개 항목)
            </h3>
            
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>추가된 기초재고 항목이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">품명</label>
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">위치</label>
                          <span className="text-sm text-gray-900">{item.location}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">규격</label>
                          <span className="text-sm text-gray-900">{item.specification || '-'}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">재질</label>
                          <span className="text-sm text-gray-900">{item.material || '-'}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">단위</label>
                          <span className="text-sm text-gray-900">{item.unit || '-'}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">수량</label>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveItem(item.id)}
                        size="sm"
                        variant="outline"
                        className="ml-3 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 mb-1">비고</label>
                        <span className="text-sm text-gray-700">{item.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* 하단 버튼 */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
            취소
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </div>
      </Card>
    </div>
  )
}
