'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Package, ArrowUp, ArrowDown } from 'lucide-react'

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StockHistory {
  id: string
  type: 'in' | 'out'
  item_name: string
  quantity: number
  unit_price: number
  total_amount: number
  reason?: string
  project?: string
  user: string
  date: string
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [historyType, setHistoryType] = useState<'all' | 'in' | 'out'>('all')
  const [historyData, setHistoryData] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(false)

  // 기본 날짜 설정 (최근 30일)
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  // 이력 데이터 로드
  const loadHistory = async () => {
    setLoading(true)
    try {
      // 실제 데이터베이스 연결 시 여기서 데이터를 가져옴
      // 현재는 임시 데이터 사용
      const mockData: StockHistory[] = [
        {
          id: '1',
          type: 'in',
          item_name: '노트북',
          quantity: 5,
          unit_price: 1200000,
          total_amount: 6000000,
          reason: '신규 구매',
          user: 'admin@example.com',
          date: '2024-01-15'
        },
        {
          id: '2',
          type: 'out',
          item_name: '프린터',
          quantity: 2,
          unit_price: 300000,
          total_amount: 600000,
          project: '프로젝트 A',
          user: 'user@example.com',
          date: '2024-01-16'
        }
      ]
      
      let filteredData = mockData
      
      // 날짜 필터링
      if (startDate && endDate) {
        filteredData = mockData.filter(item => {
          const itemDate = new Date(item.date)
          const start = new Date(startDate)
          const end = new Date(endDate)
          return itemDate >= start && itemDate <= end
        })
      }
      
      // 타입 필터링
      if (historyType !== 'all') {
        filteredData = filteredData.filter(item => item.type === historyType)
      }
      
      setHistoryData(filteredData)
    } catch (error) {
      console.error('이력 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && startDate && endDate) {
      loadHistory()
    }
  }, [isOpen, startDate, endDate, historyType])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>재고 이력 관리</span>
          </DialogTitle>
        </DialogHeader>

        {/* 필터 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이력 유형</label>
            <select
              value={historyType}
              onChange={(e) => setHistoryType(e.target.value as 'all' | 'in' | 'out')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="in">입고</option>
              <option value="out">출고</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={loadHistory}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? '로딩 중...' : '조회'}
            </Button>
          </div>
        </div>

        {/* 이력 테이블 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  구분
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  품목명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  수량
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  총액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  사유/프로젝트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  처리자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  처리일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyData.length > 0 ? (
                historyData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center space-x-2 ${
                        item.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'in' ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {item.type === 'in' ? '입고' : '출고'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reason || item.project || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {loading ? '데이터를 불러오는 중...' : '조회된 이력이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 요약 정보 */}
        {historyData.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">총 건수:</span>
                <span className="ml-2 text-blue-700">{historyData.length}건</span>
              </div>
              <div>
                <span className="font-medium text-blue-900">입고 건수:</span>
                <span className="ml-2 text-blue-700">{historyData.filter(item => item.type === 'in').length}건</span>
              </div>
              <div>
                <span className="font-medium text-blue-900">출고 건수:</span>
                <span className="ml-2 text-blue-700">{historyData.filter(item => item.type === 'out').length}건</span>
              </div>
              <div>
                <span className="font-medium text-blue-900">총 금액:</span>
                <span className="ml-2 text-blue-700">
                  {formatCurrency(historyData.reduce((sum, item) => sum + item.total_amount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 