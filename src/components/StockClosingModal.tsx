'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle, Eye, AlertTriangle } from 'lucide-react'

interface StockClosingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (closingDate: string) => void
  stockItems: any[]
}

interface PreviewItem {
  id: string
  product: string
  spec?: string
  maker?: string
  location?: string
  current_quantity: number
  closing_quantity: number
  after_closing: number
}

export default function StockClosingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  stockItems 
}: StockClosingModalProps) {
  const [closingDate, setClosingDate] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewItem[]>([])

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
      id: item.id,
      product: item.product || item.name || '',
      spec: item.spec || item.specification || '',
      maker: item.maker || '',
      location: item.location || '',
      current_quantity: item.current_quantity || item.total_qunty || 0,
      closing_quantity: item.current_quantity || item.total_qunty || 0,
      after_closing: 0 // 마감 후에는 0
    }))

    setPreviewData(preview)
    setShowPreview(true)
  }

  const handleConfirm = () => {
    if (showPreview && closingDate) {
      onConfirm(closingDate)
      onClose()
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
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {showPreview ? '마감 미리보기' : '재고 마감'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4">
          {!showPreview ? (
            // 마감 설정 단계
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">마감 처리 안내</p>
                    <p className="mt-1">
                      마감 시 현재 재고가 마감수량으로 이동되고, 입고/출고 수량이 0으로 초기화됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  마감 기준일
                </label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="px-4 py-2"
                >
                  취소
                </Button>
                <Button
                  onClick={handlePreview}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  미리보기
                </Button>
              </div>
            </div>
          ) : (
            // 미리보기 단계
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">마감 미리보기</p>
                    <p className="mt-1">
                      마감 기준일: <span className="font-medium">{closingDate}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 미리보기 테이블 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        품목
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        규격
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        위치
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        현재고
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        마감수량
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        마감후
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.spec || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.location || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-900">
                          {item.current_quantity}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-blue-600 font-medium">
                          {item.closing_quantity}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                          {item.after_closing}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="px-4 py-2"
                >
                  뒤로
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  마감 확인
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
