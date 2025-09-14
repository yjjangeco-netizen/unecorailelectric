'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { supabase } from '@/lib/supabase'
import type { CurrentStock } from '@/lib/types'
import { Search, Clock, Edit, Check, X } from 'lucide-react'

interface RentalModalProps {
  isOpen: boolean
  onClose: () => void
  stockItems: CurrentStock[]
  onRental: (itemId: string) => void
}

export default function RentalModal({ isOpen, onClose, stockItems, onRental }: RentalModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<CurrentStock[]>([])
  const [selectedItem, setSelectedItem] = useState<CurrentStock | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    itemId: '',
    itemName: '',
    spec: '',
    currentQuantity: 0,
    requestQuantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    project: '',
    notes: '',
    isRental: false,
    returnDate: '',
    // 추가 필드들
    name: '',
    maker: '',
    purpose: '',
    unit_price: 0
  })
  const [recentHistory, setRecentHistory] = useState({
    lastStockIn: '',
    lastStockOut: '',
    rentalCount: 0
  })

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = stockItems.filter(item => 
        (item.product?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.spec?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.maker?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [searchTerm, stockItems])

  const handleRental = (itemId: string) => {
    onRental(itemId)
    onClose()
  }

  const handleItemSelect = async (item: CurrentStock) => {
    setSelectedItem(item)
    setEditForm({
      itemId: item.id || '',
      itemName: item.product || '',
      spec: item.spec || '',
      currentQuantity: item.current_quantity || 0,
      requestQuantity: 1,
      unitPrice: item.unit_price || 0,
      totalAmount: item.unit_price || 0,
      project: '',
      notes: '',
      isRental: false,
      returnDate: '',
      name: item.product || '',
      maker: item.maker || '',
      purpose: item.purpose || '',
      unit_price: item.unit_price || 0
    })
    setIsEditing(false)
    
    // 최근 이력 로드
    await loadRecentHistory(item.id)
  }

  const loadRecentHistory = async (itemId: string) => {
    try {
      // 최근 입고 조회
      const { data: stockInData } = await supabase
        .from('stock_in')
        .select('received_at, received_by')
        .eq('item_id', itemId)
        .order('received_at', { ascending: false })
        .limit(1)

      // 최근 출고 조회
      const { data: stockOutData } = await supabase
        .from('stock_out')
        .select('issued_at, issued_by, project')
        .eq('item_id', itemId)
        .order('issued_at', { ascending: false })
        .limit(1)

      // 대여 중인 수량 조회
      const { data: rentalData } = await supabase
        .from('stock_out')
        .select('quantity, project')
        .eq('item_id', itemId)
        .eq('is_rental', true)
        .is('return_date', null)

      const lastStockIn = stockInData?.[0] 
        ? `${stockInData[0].received_at.split('T')[0]} (${stockInData[0].received_by})`
        : '-'
      
      const lastStockOut = stockOutData?.[0]
        ? `${stockOutData[0].issued_at.split('T')[0]} (${stockOutData[0].issued_by})${stockOutData[0].project ? ` - ${stockOutData[0].project}` : ''}`
        : '-'
      
      const rentalCount = rentalData?.reduce((sum, record) => sum + record.quantity, 0) || 0

      setRecentHistory({
        lastStockIn,
        lastStockOut,
        rentalCount
      })
    } catch (error) {
      console.error('최근 이력 로드 오류:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedItem) {return}

    try {
      const { error } = await supabase
        .from('items')
        .update({
          product: editForm.name,
          spec: editForm.spec,
          maker: editForm.maker,
          purpose: editForm.purpose,
          unit_price: editForm.unit_price
        })
        .eq('id', selectedItem.id)

      if (error) {throw error}
      
      alert('수정이 완료되었습니다.')
      setIsEditing(false)
      
      // 선택된 아이템 정보 업데이트
      setSelectedItem({
        ...selectedItem,
        product: editForm.name,
        spec: editForm.spec,
        maker: editForm.maker,
        purpose: editForm.purpose,
        unit_price: editForm.unit_price
      })
    } catch (error) {
      console.error('수정 오류:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    if (selectedItem) {
      setEditForm({
        itemId: selectedItem.id || '',
        itemName: selectedItem.product || '',
        spec: selectedItem.spec || '',
        currentQuantity: selectedItem.current_quantity || 0,
        requestQuantity: 1,
        unitPrice: selectedItem.unit_price || 0,
        totalAmount: selectedItem.unit_price || 0,
        project: '',
        notes: '',
        isRental: false,
        returnDate: '',
        name: selectedItem.product || '',
        maker: selectedItem.maker || '',
        purpose: selectedItem.purpose || '',
        unit_price: selectedItem.unit_price || 0
      })
    }
    setIsEditing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>대여 관리</DialogTitle>
          <DialogDescription>
            품목을 대여하고 반납을 관리할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 검색 및 결과 */}
          <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="품명, 규격, 메이커, 용도로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* 필터 해제 버튼 */}
            {searchTerm && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  검색어 해제
                </Button>
              </div>
            )}

            {/* 검색 결과 */}
            {searchTerm && (
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  검색 결과: {filteredItems.length}개
                </div>
                
                {filteredItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            품명
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            규격
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            메이커
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            재고
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map((item) => (
                          <tr 
                            key={item.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedItem?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => handleItemSelect(item)}
                          >
                                                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                          {item.product}
                        </td>
                                                          <td className="border-gray-300 px-3 py-2 text-sm text-gray-900">
                                {item.spec || '-'}
                              </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {item.maker || '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              <span className={`font-medium ${item.current_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.current_quantity}개
                              </span>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRental(item.id)
                                  }}
                                  disabled={item.current_quantity <= 0}
                                  className="text-xs"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  대여
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 검색 팁 */}
            {!searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>품명, 규격, 메이커, 용도로 검색해보세요</p>
                <p className="text-sm mt-2">예: &quot;볼트&quot;, &quot;M8&quot;, &quot;삼성&quot;, &quot;전기&quot;</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 선택된 항목 상세 정보 */}
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">선택된 품목 정보</h3>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        편집
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSave}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-1" />
                          취소
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">품명</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedItem.product}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">규격</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedItem.spec || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">메이커</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedItem.maker || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">용도</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedItem.purpose || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">현재 재고</label>
                        <p className={`mt-1 text-sm font-medium ${selectedItem.current_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedItem.current_quantity}개
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">단가</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedItem.unit_price?.toLocaleString()}원</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">품명</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">규격</label>
                        <input
                          type="text"
                          value={editForm.spec}
                          onChange={(e) => setEditForm({...editForm, spec: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">메이커</label>
                        <input
                          type="text"
                          value={editForm.maker}
                          onChange={(e) => setEditForm({...editForm, maker: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">용도</label>
                        <input
                          type="text"
                          value={editForm.purpose}
                          onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">단가</label>
                        <input
                          type="number"
                          value={editForm.unit_price}
                          onChange={(e) => setEditForm({...editForm, unit_price: Number(e.target.value)})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 대여 이력 요약 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-3">대여 이력</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>최근 입고:</span>
                    <span className="text-green-600">{recentHistory.lastStockIn}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>최근 출고:</span>
                    <span className="text-red-600">{recentHistory.lastStockOut}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>대여 중:</span>
                    <span className="text-blue-600">{recentHistory.rentalCount > 0 ? `${recentHistory.rentalCount}개` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 