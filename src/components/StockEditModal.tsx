'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Save, X } from 'lucide-react'

interface StockEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, data: {
    edit_date: string
    product: string
    spec: string
    maker: string
    unit_price: number
    purpose: string
    stock_status: string
    note: string
    location: string
    current_quantity: number
    stock_in_quantity: number
    stock_out_quantity: number
  }) => void
  onDelete: (itemId: string) => void
  item: any
  canDelete?: boolean
}

export default function StockEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  item,
  canDelete = true
}: StockEditModalProps) {
  const [editDate, setEditDate] = useState('')
  const [product, setProduct] = useState('')
  const [spec, setSpec] = useState('')
  const [maker, setMaker] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [purpose, setPurpose] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [note, setNote] = useState('')
  const [location, setLocation] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState(0)
  const [stockInQuantity, setStockInQuantity] = useState(0)
  const [stockOutQuantity, setStockOutQuantity] = useState(0)
  const [error, setError] = useState('')

  // 모달이 열릴 때 아이템 데이터로 초기화
  useEffect(() => {
    if (isOpen && item) {
      const today = new Date()
      const formattedDate = today.toISOString().split('T')[0]
      setEditDate(formattedDate)
      setProduct((item.product || item.name || '').toString())
      setSpec((item.spec || item.specification || '').toString())
      setMaker((item.maker || '').toString())
      setUnitPrice(item.unit_price || 0)
      setPurpose((item.purpose || '').toString())
      setStockStatus((item.stock_status || '').toString())
      setNote((item.note || '').toString())
      setLocation((item.location || '').toString())
      setCurrentQuantity(item.current_quantity || item.total_qunty || 0)
      setStockInQuantity(item.stock_in_quantity || 0)
      setStockOutQuantity(item.stock_out_quantity || 0)
      setError('')
    }
  }, [isOpen, item])

  const handleSubmit = () => {
    if (!item) return

    // 유효성 검사
    if (!editDate) {
      setError('수정 날짜를 입력해주세요.')
      return
    }

    if (!product.trim()) {
      setError('품목명을 입력해주세요.')
      return
    }

    if (!spec.trim()) {
      setError('규격을 입력해주세요.')
      return
    }

    if (unitPrice < 0) {
      setError('단가는 0 이상이어야 합니다.')
      return
    }

    if (stockInQuantity < 0) {
      setError('입고 수량은 0 이상이어야 합니다.')
      return
    }

    if (stockOutQuantity < 0) {
      setError('출고 수량은 0 이상이어야 합니다.')
      return
    }

    // 저장
    if (!item.id) {
      setError('품목 ID를 찾을 수 없습니다.')
      return
    }
    
    onSave(item.id, {
      edit_date: editDate,
      product: product.trim(),
      spec: spec.trim(),
      maker: maker.trim(),
      unit_price: unitPrice,
      purpose: purpose.trim(),
      stock_status: stockStatus,
      note: note.trim(),
      location: location.trim(),
      current_quantity: item.current_quantity || item.total_qunty || 0, // 원래 수량 유지
      stock_in_quantity: stockInQuantity,
      stock_out_quantity: stockOutQuantity
    })
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Edit className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">재고 전체 수정</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4 space-y-6">
          {/* 수정 필드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수정 날짜 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value || '')}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                품목명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="품목명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                규격 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="규격을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제조사
              </label>
              <input
                type="text"
                value={maker}
                onChange={(e) => setMaker(e.target.value)}
                placeholder="제조사를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                단가
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                placeholder="단가를 입력하세요"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                용도
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="용도를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                품목 상태
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">품목 상태를 선택하세요</option>
                <option value="new">신품</option>
                <option value="used-new">중고신품</option>
                <option value="used-used">중고사용품</option>
                <option value="broken">불량품</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현재 위치
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="재고 위치를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현재 수량 (읽기 전용)
              </label>
              <input
                type="number"
                value={currentQuantity}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                수량은 입고/출고를 통해서만 변경됩니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입고 수량
              </label>
              <input
                type="number"
                value={stockInQuantity}
                onChange={(e) => setStockInQuantity(parseInt(e.target.value) || 0)}
                placeholder="입고 수량을 입력하세요"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                누적 입고 수량을 입력하세요
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출고 수량
              </label>
              <input
                type="number"
                value={stockOutQuantity}
                onChange={(e) => setStockOutQuantity(parseInt(e.target.value) || 0)}
                placeholder="출고 수량을 입력하세요"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                누적 출고 수량을 입력하세요
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비고
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="추가 정보를 입력하세요"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="px-4 py-2"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              전체 수정 저장
            </Button>
            {canDelete && (
              <Button
                onClick={() => onDelete(item.id)}
                variant="outline"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                삭제
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
