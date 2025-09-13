'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Save, X } from 'lucide-react'

interface ItemEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, updates: { stock_status: string; location: string; closing_quantity: number }) => void
  item: any
}

export default function ItemEditModal({ isOpen, onClose, onSave, item }: ItemEditModalProps) {
  const [stockStatus, setStockStatus] = useState('')
  const [location, setLocation] = useState('')
  const [closingQuantity, setClosingQuantity] = useState(0)
  const [error, setError] = useState('')

  // 모달이 열릴 때 아이템 데이터로 초기화
  useEffect(() => {
    if (isOpen && item) {
      setStockStatus(item.stock_status || 'new')
      setLocation(item.location || '')
      setClosingQuantity(item.closing_quantity || 0)
      setError('')
    }
  }, [isOpen, item])

  const handleSubmit = () => {
    if (!item) return

    // 유효성 검사
    if (closingQuantity < 0) {
      setError('마감수량은 0 이상이어야 합니다.')
      return
    }

    // 저장
    onSave(item.id, {
      stock_status: stockStatus,
      location: location,
      closing_quantity: closingQuantity
    })
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">품목 수정</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 품목 정보 표시 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">품목 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">품명:</span>
                <span className="font-medium text-gray-900">{item.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">규격:</span>
                <span className="font-medium text-gray-900">{item.spec || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">현재고:</span>
                <span className="font-medium text-gray-900">{item.current_quantity || 0}</span>
              </div>
            </div>
          </div>

          {/* 수정 필드들 */}
          <div className="space-y-4">
            {/* 품목상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                품목상태 <span className="text-red-500">*</span>
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">신품</option>
                <option value="used-new">중고신품</option>
                <option value="used-used">중고사용품</option>
                <option value="broken">고장</option>
              </select>
            </div>

            {/* 위치 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위치
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="재고 위치를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 마감수량 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마감수량
              </label>
              <input
                type="number"
                value={closingQuantity}
                onChange={(e) => setClosingQuantity(parseInt(e.target.value) || 0)}
                min="0"
                placeholder="마감수량을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 py-3"
            >
              취소
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
