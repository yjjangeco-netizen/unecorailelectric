'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import CommonHeader from '@/components/CommonHeader'
import { ArrowLeft, Calendar, Package, User, DollarSign } from 'lucide-react'

interface ClosingHistoryItem {
  id: string
  closing_date: string
  item_id: number
  product: string
  spec: string
  maker: string
  location: string
  closing_quantity: number
  unit_price: number
  total_amount: number
  closed_by: string
  created_at: string
}

export default function StockClosingHistoryPage() {
  const [history, setHistory] = useState<ClosingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; level: string } | null>(null)

  useEffect(() => {
    // 로그인 상태 확인
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setCurrentUser({
          id: userData.id || userData.username,
          name: userData.name,
          level: userData.level || '1'
        })
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error)
      }
    }
    
    loadHistory()
  }, [])

  const loadHistory = async (date?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const url = date ? `/api/stock/closing-history?date=${date}` : '/api/stock/closing-history'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('마감 이력을 가져오는데 실패했습니다.')
      }
      
      const data = await response.json()
      setHistory(data.history || [])
    } catch (error) {
      console.error('마감 이력 로드 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = () => {
    loadHistory(selectedDate)
  }

  const handleClearFilter = () => {
    setSelectedDate('')
    loadHistory()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 날짜별로 그룹화
  const groupedHistory = history.reduce((acc, item) => {
    const date = item.closing_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {} as Record<string, ClosingHistoryItem[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 공통 헤더 */}
      <CommonHeader
        currentUser={currentUser}
        isAdmin={currentUser?.level === 'administrator' || currentUser?.level === '5'}
        title="재고 마감 이력"
        showBackButton={true}
        backUrl="/stock-management"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* 필터 섹션 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">마감 이력 조회</h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <Button 
              onClick={handleDateFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              조회
            </Button>
            
            <Button 
              onClick={handleClearFilter}
              variant="outline"
            >
              전체 조회
            </Button>
          </div>
        </div>

        {/* 마감 이력 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">마감 이력 목록</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">마감 이력을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => loadHistory()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                다시 시도
              </Button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">마감 이력이 없습니다</h3>
              <p className="text-gray-600">선택한 날짜에 마감 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDate(date)} 마감 이력
                    </h3>
                    <span className="text-sm text-gray-500">
                      {items.length}개 품목
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">품목명</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">규격</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">제조사</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">위치</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">마감수량</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">단가</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">금액</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">마감자</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">마감시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium text-gray-900">{item.product}</td>
                            <td className="py-2 px-3 text-gray-600">{item.spec || '-'}</td>
                            <td className="py-2 px-3 text-gray-600">{item.maker || '-'}</td>
                            <td className="py-2 px-3 text-gray-600">{item.location || '-'}</td>
                            <td className="py-2 px-3 text-right font-medium text-gray-900">
                              {item.closing_quantity.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {item.unit_price.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-blue-600">
                              {item.total_amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-gray-600">{item.closed_by}</td>
                            <td className="py-2 px-3 text-gray-500 text-xs">
                              {formatDateTime(item.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        총 {items.length}개 품목
                      </span>
                      <span className="font-semibold text-gray-900">
                        총 금액: {items.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
