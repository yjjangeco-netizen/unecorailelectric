'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Package, AlertTriangle, Eye, CheckCircle, X } from 'lucide-react'

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
      setClosingDate(formattedDate || '')
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-2xl" aria-describedby="closing-description">
        {/* Header Section */}
        <div className="bg-amber-50/50 px-8 py-6 border-b border-amber-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-amber-950">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              재고 마감
            </DialogTitle>
            <p id="closing-description" className="text-amber-600/80 mt-2 text-sm font-medium">
              현재 재고 수량을 기준으로 마감 처리를 진행합니다.
            </p>
          </DialogHeader>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* 안내 메시지 */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2 bg-white rounded-full shadow-sm flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-amber-900">마감 처리 시 주의사항</h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>선택한 날짜 기준으로 <span className="font-bold">현재고가 마감수량으로 저장</span>됩니다.</li>
                  <li>마감 처리 후 현재고는 0으로 초기화되지 않고 유지됩니다.</li>
                  <li>이 작업은 되돌릴 수 없습니다.</li>
                </ul>
              </div>
            </div>

            {/* 날짜 선택 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                마감 기준일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={closingDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-amber-500 rounded-xl focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 font-medium"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>

            {/* 미리보기 섹션 */}
            {showPreview && previewData.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-bold text-gray-900">마감 처리 미리보기</h3>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-4 font-medium">
                    <span className="text-gray-900 font-bold">{closingDate}</span> 기준으로 마감 처리 시 예상 결과:
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">{previewData.length}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">처리 품목 수</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {previewData.reduce((sum, item) => sum + (item.current_quantity || 0), 0)}
                      </div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">총 마감 수량</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {previewData.filter(item => (item.current_quantity || 0) > 0).length}
                      </div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">재고 보유 품목</div>
                    </div>
                  </div>
                </div>

                {/* 미리보기 테이블 */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">품목</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">현재고</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">마감 후</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">변화</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {previewData.slice(0, 50).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.current_quantity || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">0</td>
                            <td className="px-4 py-3 text-sm font-bold text-red-500 text-right">-{item.current_quantity || 0}</td>
                          </tr>
                        ))}
                        {previewData.length > 50 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-xs text-gray-500 text-center bg-gray-50">
                              ... 외 {previewData.length - 50}개 품목
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 그룹 */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {!showPreview ? (
                <>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handlePreview}
                    disabled={!closingDate}
                    className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 rounded-xl font-bold transition-all"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    미리보기
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    className="flex-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all"
                  >
                    다시 선택
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 rounded-xl font-bold transition-all"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    마감 확정
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
