'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Package, AlertTriangle, Eye, CheckCircle } from 'lucide-react'

interface ClosingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (closingDate: string) => void
  stockItems: any[]
}

export default function ClosingModal({ isOpen, onClose, onSave, stockItems }: ClosingModalProps) {
  const [closingDate, setClosingDate] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])

  // 컴포넌트가 열릴 때 오늘 날짜로 설정
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const formattedDate = today.toISOString().split('T')[0]
      setClosingDate(formattedDate)
      setError('')
      setShowPreview(false)
    }
  }, [isOpen])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value
    setClosingDate(selectedDate)
    setError('')
    setShowPreview(false)
  }

  const handlePreview = () => {
    if (!closingDate) {
      setError('마감 기준일을 선택해주세요.')
      return
    }

    const today = new Date()
    const selectedDate = new Date(closingDate)
    
    if (selectedDate > today) {
      setError('마감 기준일은 오늘 이전이어야 합니다.')
      return
    }

    // 미리보기 데이터 생성
    const preview = stockItems.map(item => ({
      ...item,
      current_quantity: item.current_quantity || 0,
      closing_quantity: item.current_quantity || 0,
      after_closing: 0
    }))

    setPreviewData(preview)
    setShowPreview(true)
  }

  const handleConfirm = () => {
    if (showPreview) {
      onSave(closingDate)
    }
  }

  const handleClose = () => {
    setClosingDate('')
    setError('')
    setShowPreview(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">재고 마감</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">마감 처리 안내</p>
                <p>• 선택한 날짜 기준으로 현재고가 마감수량으로 저장됩니다</p>
                <p>• 현재고는 0으로 초기화됩니다</p>
                <p>• 이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
          </div>

          {/* 날짜 선택 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              마감 기준일 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={closingDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="날짜를 선택하세요"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex space-x-3">
            <Button
              onClick={handlePreview}
              disabled={!closingDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <Eye className="h-4 w-4 mr-2" />
              미리보기
            </Button>
          </div>

          {/* 미리보기 테이블 */}
          {showPreview && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">마감 처리 미리보기</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>{closingDate}</strong> 기준으로 마감 처리 시:
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{previewData.length}</div>
                    <div className="text-gray-500">처리 품목 수</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">
                      {previewData.reduce((sum, item) => sum + (item.current_quantity || 0), 0)}
                    </div>
                    <div className="text-gray-500">총 마감 수량</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-600">
                      {previewData.filter(item => (item.current_quantity || 0) > 0).length}
                    </div>
                    <div className="text-gray-500">재고 보유 품목</div>
                  </div>
                </div>
              </div>

              {/* 미리보기 테이블 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">품목</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">현재고</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">마감 후</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">변화</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-900">{item.product}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.current_quantity || 0}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">0</td>
                        <td className="px-3 py-2 text-xs">
                          <span className="text-red-600">-{item.current_quantity || 0}</span>
                        </td>
                      </tr>
                    ))}
                    {previewData.length > 10 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-xs text-gray-500 text-center">
                          ... 외 {previewData.length - 10}개 품목
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 확정 버튼 */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  마감 확정
                </Button>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  다시 선택
                </Button>
              </div>
            </div>
          )}

          {/* 닫기 버튼 (미리보기 모드가 아닐 때만) */}
          {!showPreview && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 py-3"
              >
                닫기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
