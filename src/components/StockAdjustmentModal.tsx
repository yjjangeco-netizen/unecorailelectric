'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, X, Save, Search, Edit, AlertTriangle } from 'lucide-react'

interface StockAdjustmentItem {
  id: string
  name: string
  location: string
  specification: string
  material: string
  unit: string
  currentQuantity: number
  adjustedQuantity: number
  adjustmentReason: string
  notes: string
}

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (adjustments: StockAdjustmentItem[]) => void
  existingStock?: StockAdjustmentItem[]
}

export default function StockAdjustmentModal({ 
  isOpen, 
  onClose, 
  onSave, 
  existingStock = [] 
}: StockAdjustmentModalProps) {
  const [items, setItems] = useState<StockAdjustmentItem[]>(existingStock)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<StockAdjustmentItem[]>([])
  const [selectedItem, setSelectedItem] = useState<StockAdjustmentItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // 검색 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items)
    } else {
      const filtered = items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredItems(filtered)
    }
  }, [searchTerm, items])

  const handleQuantityAdjustment = (id: string, newQuantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, adjustedQuantity: newQuantity }
        : item
    ))
  }

  const handleAdjustmentReason = (id: string, reason: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, adjustmentReason: reason }
        : item
    ))
  }

  const handleNotes = (id: string, notes: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, notes }
        : item
    ))
  }

  const handleEditItem = (item: StockAdjustmentItem) => {
    setSelectedItem(item)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!selectedItem) {return}

    setItems(prev => prev.map(item => 
      item.id === selectedItem.id 
        ? selectedItem
        : item
    ))
    setIsEditing(false)
    setSelectedItem(null)
  }

  const handleSaveAll = () => {
    const adjustments = items.filter(item => 
      item.adjustedQuantity !== item.currentQuantity || 
      item.adjustmentReason || 
      item.notes
    )
    
    if (adjustments.length === 0) {
      alert('조정된 항목이 없습니다.')
      return
    }

    onSave(adjustments)
    onClose()
  }

  const getAdjustmentDifference = (item: StockAdjustmentItem) => {
    return item.adjustedQuantity - item.currentQuantity
  }

  const getAdjustmentColor = (item: StockAdjustmentItem) => {
    const diff = getAdjustmentDifference(item)
    if (diff > 0) {return 'text-green-600'}
    if (diff < 0) {return 'text-red-600'}
    return 'text-gray-600'
  }

  if (!isOpen) {return null}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-orange-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-orange-900">
              <TrendingUp className="h-5 w-5 mr-2" />
              기초재고 조정
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
          {/* 검색 및 필터 */}
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="품명, 위치, 규격, 재질로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                총 {filteredItems.length}개 항목
              </div>
            </div>
          </div>

          {/* 조정 항목 목록 */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>조정할 재고 항목이 없습니다.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {/* 기본 정보 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">품명</label>
                          <span className="text-sm font-medium text-gray-900">{item.product}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">위치</label>
                          <span className="text-sm text-gray-900">{item.location}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">규격</label>
                          <span className="text-sm text-gray-900">{item.spec || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 수량 정보 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">현재 수량</label>
                          <span className="text-sm font-medium text-gray-900">{item.currentQuantity}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">조정 수량</label>
                          <input
                            type="number"
                            value={item.adjustedQuantity}
                            onChange={(e) => handleQuantityAdjustment(item.id, Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">차이</label>
                          <span className={`text-sm font-medium ${getAdjustmentColor(item)}`}>
                            {getAdjustmentDifference(item) > 0 ? '+' : ''}{getAdjustmentDifference(item)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 조정 사유 및 비고 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">조정 사유</label>
                          <input
                            type="text"
                            placeholder="수량 조정 사유"
                            value={item.adjustmentReason}
                            onChange={(e) => handleAdjustmentReason(item.id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">비고</label>
                          <input
                            type="text"
                            placeholder="추가 비고"
                            value={item.notes}
                            onChange={(e) => handleNotes(item.id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 작업 버튼 */}
                    <div className="lg:col-span-1">
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => handleEditItem(item)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          편집
                        </Button>
                        
                        {getAdjustmentDifference(item) !== 0 && (
                          <div className="text-xs text-center p-2 rounded bg-yellow-50 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mx-auto mb-1" />
                            수량 변경됨
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>

        {/* 하단 버튼 */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
            취소
          </Button>
          <Button onClick={handleSaveAll} className="bg-orange-600 hover:bg-orange-700">
            <Save className="h-4 w-4 mr-2" />
            조정사항 저장
          </Button>
        </div>
      </Card>

      {/* 편집 모달 */}
      {isEditing && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-900">항목 편집</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품명</label>
                  <input
                    type="text"
                    value={selectedItem.product}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, product: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    value={selectedItem.location}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, location: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">조정 수량</label>
                  <input
                    type="number"
                    value={selectedItem.adjustedQuantity}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, adjustedQuantity: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">조정 사유</label>
                  <input
                    type="text"
                    value={selectedItem.adjustmentReason}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, adjustmentReason: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={selectedItem.notes}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              <Button onClick={() => setIsEditing(false)} variant="outline">
                취소
              </Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                저장
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
