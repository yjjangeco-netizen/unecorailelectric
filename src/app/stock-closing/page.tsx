'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Package, 
  TrendingUp, 
  FileText, 
  Download, 
  ArrowLeft,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import BasicStockModal from '@/components/BasicStockModal'
import StockAdjustmentModal from '@/components/StockAdjustmentModal'

interface StockItem {
  id: string
  name: string
  location: string
  specification: string
  material: string
  unit: string
  currentQuantity: number
  previousQuarterQuantity: number
  basicStockQuantity: number
}

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

interface ClosingData {
  quarter: number
  year: number
  closingDate: string
  status: 'pending' | 'completed'
  items: StockItem[]
}

export default function StockClosingPage() {
  const router = useRouter()
  const [currentQuarter, setCurrentQuarter] = useState(1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [closingHistory, setClosingHistory] = useState<ClosingData[]>([])
  const [showBasicStockModal, setShowBasicStockModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState(1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [basicStockItems, setBasicStockItems] = useState<BasicStockItem[]>([])
  const [adjustmentItems, setAdjustmentItems] = useState<StockAdjustmentItem[]>([])

  // 현재 분기 및 마감 가능 여부 계산
  useEffect(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    
    let quarter = 1
    if (month >= 4 && month <= 6) quarter = 1
    else if (month >= 7 && month <= 9) quarter = 2
    else if (month >= 10 && month <= 12) quarter = 3
    else quarter = 4
    
    setCurrentQuarter(quarter)
    setCurrentYear(year)
    setSelectedYear(year)
  }, [])

  // 마감 가능한 분기 확인
  const canCloseQuarter = (quarter: number, year: number): boolean => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    // 분기별 마감 시기 확인
    const closingMonths: Record<number, number> = { 1: 4, 2: 7, 3: 10, 4: 1 }
    const closingMonth = closingMonths[quarter]
    
    if (quarter === 4) {
      // 4분기는 다음해 1월에 마감
      return currentMonth === closingMonth && currentYear === year + 1
    } else {
      return currentMonth === closingMonth && currentYear === year
    }
  }

  // 기초재고 저장 처리
  const handleBasicStockSave = (items: BasicStockItem[]) => {
    setBasicStockItems(items)
    
    // 기초재고를 현재 재고에 반영
    const updatedStockItems = items.map(item => ({
      id: item.id,
      name: item.name,
      location: item.location,
      specification: item.specification,
      material: item.material,
      unit: item.unit,
      currentQuantity: item.quantity,
      previousQuarterQuantity: 0,
      basicStockQuantity: item.quantity
    }))
    
    setStockItems(updatedStockItems)
    alert(`${items.length}개의 기초재고 항목이 저장되었습니다.`)
  }

  // 재고 조정 저장 처리
  const handleAdjustmentSave = (adjustments: StockAdjustmentItem[]) => {
    setAdjustmentItems(adjustments)
    
    // 조정사항을 현재 재고에 반영
    const updatedStockItems = stockItems.map(item => {
      const adjustment = adjustments.find(adj => adj.id === item.id)
      if (adjustment) {
        return {
          ...item,
          currentQuantity: adjustment.adjustedQuantity
        }
      }
      return item
    })
    
    setStockItems(updatedStockItems)
    alert(`${adjustments.length}개의 재고 조정사항이 저장되었습니다.`)
  }

  // 분기 마감 처리
  const handleQuarterClosing = async (quarter: number, year: number): Promise<void> => {
    if (!canCloseQuarter(quarter, year)) {
      alert('아직 마감 시기가 아닙니다.')
      return
    }

    if (stockItems.length === 0) {
      alert('기초재고를 먼저 입력해주세요.')
      return
    }

    try {
      // 현재 재고를 전분기 재고로 이동
      const updatedItems = stockItems.map(item => ({
        ...item,
        previousQuarterQuantity: item.currentQuantity
      }))

      // 마감 이력에 추가
      const newClosing: ClosingData = {
        quarter,
        year,
        closingDate: new Date().toISOString(),
        status: 'completed',
        items: updatedItems
      }

      setClosingHistory(prev => [...prev, newClosing])
      setStockItems(updatedItems)
      
      alert(`${year}년 ${quarter}분기 마감이 완료되었습니다.`)
    } catch (error) {
      console.error('분기 마감 오류:', error)
      alert('분기 마감 중 오류가 발생했습니다.')
    }
  }

  // 연마감 처리
  const handleAnnualClosing = async (year: number): Promise<void> => {
    try {
      // 해당 연도의 모든 분기 마감 확인
      const yearClosings = closingHistory.filter(c => c.year === year)
      if (yearClosings.length < 4) {
        alert('모든 분기 마감을 완료한 후 연마감을 진행해주세요.')
        return
      }

      // 연마감 처리 로직
      alert(`${year}년 연마감이 완료되었습니다.`)
    } catch (error) {
      console.error('연마감 오류:', error)
      alert('연마감 중 오류가 발생했습니다.')
    }
  }

  // 분기별 입출고 현황 조회
  const getQuarterlyReport = (quarter: number, year: number) => {
    const closing = closingHistory.find(c => c.quarter === quarter && c.year === year)
    if (!closing) return null

    return {
      quarter,
      year,
      closingDate: closing.closingDate,
      totalItems: closing.items.length,
      totalQuantity: closing.items.reduce((sum, item) => sum + item.currentQuantity, 0)
    }
  }

  // 입출고 보고서 생성
  const generateReport = (quarter: number, year: number): void => {
    const report = getQuarterlyReport(quarter, year)
    if (!report) {
      alert('해당 분기의 마감 데이터가 없습니다.')
      return
    }

    // CSV 형태로 보고서 생성
    const csvContent = generateCSVReport(quarter, year)
    downloadCSV(csvContent, `${year}년_${quarter}분기_입출고보고서.csv`)
  }

  const generateCSVReport = (quarter: number, year: number): string => {
    const closing = closingHistory.find(c => c.quarter === quarter && c.year === year)
    if (!closing) return ''

    const headers = ['Tag NO.', '위치', '품명', '규격', '재질', '단위', '전분기 재고', '입고수량', '불출수량', '최종재고', '실수량', '불출내용', '비고']
    const rows = closing.items.map((item, index) => [
      `TAG-${String(index + 1).padStart(4, '0')}`,
      item.location,
      item.name,
      item.specification,
      item.material,
      item.unit,
      item.previousQuarterQuantity,
      '0', // 입고수량 (실제 데이터 연동 필요)
      '0', // 불출수량 (실제 데이터 연동 필요)
      item.currentQuantity,
      item.currentQuantity, // 실수량
      '', // 불출내용
      '' // 비고
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">재고 마감 관리</h1>
            </div>
            
            <Button
              onClick={() => router.push('/stock-management')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>재고관리로</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 현재 상태 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">현재 분기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{currentQuarter}분기</div>
              <p className="text-sm text-gray-500">{currentYear}년</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">마감 가능 여부</CardTitle>
            </CardHeader>
            <CardContent>
              {canCloseQuarter(currentQuarter, currentYear) ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">마감 가능</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="font-medium">마감 대기</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">총 품목 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stockItems.length}</div>
              <p className="text-sm text-gray-500">개 품목</p>
            </CardContent>
          </Card>
        </div>

        {/* 마감 관리 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 분기 마감 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                분기 마감
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">분기 선택</label>
                  <select 
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={1}>1분기 (1-3월)</option>
                    <option value={2}>2분기 (4-6월)</option>
                    <option value={3}>3분기 (7-9월)</option>
                    <option value={4}>4분기 (10-12월)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => handleQuarterClosing(selectedQuarter, selectedYear)}
                  disabled={!canCloseQuarter(selectedQuarter, selectedYear)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {selectedQuarter}분기 마감
                </Button>
                
                <div className="text-xs text-gray-500">
                  {selectedQuarter === 1 && `${selectedYear}년 4월에 마감 가능`}
                  {selectedQuarter === 2 && `${selectedYear}년 7월에 마감 가능`}
                  {selectedQuarter === 3 && `${selectedYear}년 10월에 마감 가능`}
                  {selectedQuarter === 4 && `${selectedYear + 1}년 1월에 마감 가능`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 연마감 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                연마감
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연도 선택</label>
                <input
                  type="number"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <Button
                onClick={() => handleAnnualClosing(currentYear)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {currentYear}년 연마감
              </Button>
              
              <div className="text-xs text-gray-500">
                모든 분기 마감 완료 후 연마감 가능
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 기초재고 관리 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-600" />
              기초재고 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => setShowBasicStockModal(true)}
                variant="outline"
                className="h-12"
              >
                기초재고 입력
              </Button>
              <Button
                onClick={() => setShowAdjustmentModal(true)}
                variant="outline"
                className="h-12"
              >
                기초재고 조정
              </Button>
            </div>
            
            {/* 기초재고 현황 */}
            {basicStockItems.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">기초재고 현황</h4>
                <p className="text-sm text-blue-700">
                  총 {basicStockItems.length}개 항목, 
                  총 수량: {basicStockItems.reduce((sum, item) => sum + item.quantity, 0)}개
                </p>
              </div>
            )}
            
            {/* 조정 현황 */}
            {adjustmentItems.length > 0 && (
              <div className="mt-2 p-4 bg-orange-50 rounded-lg">
                <h4 className="text-sm font-medium text-orange-900 mb-2">재고 조정 현황</h4>
                <p className="text-sm text-orange-700">
                  총 {adjustmentItems.length}개 항목 조정됨
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 분기별 현황 및 보고서 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
              분기별 현황 및 보고서
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연도</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분기</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">마감일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {closingHistory.map((closing, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {closing.year}년
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {closing.quarter}분기
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(closing.closingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          closing.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {closing.status === 'completed' ? '완료' : '대기'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => generateReport(closing.quarter, closing.year)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          보고서
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {closingHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>마감 이력이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기초재고 입력 모달 */}
      <BasicStockModal
        isOpen={showBasicStockModal}
        onClose={() => setShowBasicStockModal(false)}
        onSave={handleBasicStockSave}
        existingItems={basicStockItems}
      />

      {/* 기초재고 조정 모달 */}
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSave={handleAdjustmentSave}
        existingStock={stockItems.map(item => ({
          id: item.id,
          name: item.name,
          location: item.location,
          specification: item.specification,
          material: item.material,
          unit: item.unit,
          currentQuantity: item.currentQuantity,
          adjustedQuantity: item.currentQuantity,
          adjustmentReason: '',
          notes: ''
        }))}
      />
    </div>
  )
}
