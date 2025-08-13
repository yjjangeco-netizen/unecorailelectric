'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package, Calendar, User, FileText, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StockIn, Item } from '@/lib/supabase'

interface StockInListModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StockInWithItem extends StockIn {
  item: Item
}

export default function StockInListModal({ isOpen, onClose }: StockInListModalProps) {
  const [stockIns, setStockIns] = useState<StockInWithItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStockIns, setFilteredStockIns] = useState<StockInWithItem[]>([])
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadStockIns()
    }
  }, [isOpen])

  useEffect(() => {
    let filtered = stockIns

    // 검색어 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(stockIn =>
        stockIn.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockIn.item.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockIn.item.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockIn.received_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockIn.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockIn.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 날짜 필터
    if (dateFilter) {
      filtered = filtered.filter(stockIn =>
        stockIn.received_at.startsWith(dateFilter)
      )
    }

    setFilteredStockIns(filtered)
  }, [searchTerm, dateFilter, stockIns])

  const loadStockIns = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          *,
          item:items (
            id,
            name,
            specification,
            maker,
            purpose,
            unit_price
          )
        `)
        .order('received_at', { ascending: false })

      if (error) throw error
      setStockIns(data || [])
    } catch (error) {
      console.error('입고 이력 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setDateFilter('')
  }

  const getConditionTypeLabel = (conditionType: string) => {
    switch (conditionType) {
      case 'new': return '신품'
      case 'used_good': return '양호'
      case 'used_defective': return '불량'
      case 'unknown': return '미상'
      default: return conditionType
    }
  }

  const getConditionTypeColor = (conditionType: string) => {
    switch (conditionType) {
      case 'new': return 'bg-green-100 text-green-800'
      case 'used_good': return 'bg-blue-100 text-blue-800'
      case 'used_defective': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const displayStockIns = searchTerm.trim() || dateFilter ? filteredStockIns : stockIns

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            입고 이력
          </DialogTitle>
          <DialogDescription>
            전체 입고 이력을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 검색 및 필터 */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="품목명, 규격, 메이커, 입고자, 프로젝트, 비고로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            {(searchTerm.trim() || dateFilter) && (
              <Button onClick={handleClearSearch} variant="outline" size="sm">
                해제
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">규격</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메이커</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayStockIns.map((stockIn) => (
                  <tr key={stockIn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stockIn.item.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockIn.item.specification || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockIn.item.maker || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium text-green-600">{stockIn.quantity}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockIn.unit_price ? `₩${stockIn.unit_price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockIn.total_amount ? `₩${stockIn.total_amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionTypeColor(stockIn.condition_type)}`}>
                        {getConditionTypeLabel(stockIn.condition_type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {stockIn.received_by || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(stockIn.received_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockIn.project || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {stockIn.notes || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {displayStockIns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {(searchTerm.trim() || dateFilter) ? '검색 결과가 없습니다.' : '입고 이력이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 통계 정보 */}
        {stockIns.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">입고 통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-500">총 입고 건수:</span>
                <span className="ml-2 font-medium">{stockIns.length}건</span>
              </div>
              <div>
                <span className="text-gray-500">총 입고 수량:</span>
                <span className="ml-2 font-medium text-green-600">
                  {stockIns.reduce((sum, s) => sum + s.quantity, 0)}개
                </span>
              </div>
              <div>
                <span className="text-gray-500">총 입고 금액:</span>
                <span className="ml-2 font-medium text-green-600">
                  ₩{stockIns.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">최근 입고:</span>
                <span className="ml-2 font-medium">
                  {stockIns.length > 0 ? new Date(stockIns[0].received_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">검색 결과:</span>
                <span className="ml-2 font-medium">
                  {displayStockIns.length}건
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 