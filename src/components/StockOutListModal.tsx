'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package, Calendar, User, FileText, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StockOut, Item } from '@/lib/supabase'

interface StockOutListModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StockOutWithItem extends StockOut {
  item: Item
}

export default function StockOutListModal({ isOpen, onClose }: StockOutListModalProps) {
  const [stockOuts, setStockOuts] = useState<StockOutWithItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStockOuts, setFilteredStockOuts] = useState<StockOutWithItem[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [rentalFilter, setRentalFilter] = useState<'all' | 'rental' | 'normal'>('all')

  useEffect(() => {
    if (isOpen) {
      loadStockOuts()
    }
  }, [isOpen])

  useEffect(() => {
    let filtered = stockOuts

    // 검색어 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(stockOut =>
        stockOut.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockOut.item.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockOut.item.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockOut.issued_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockOut.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockOut.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stockOut.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 날짜 필터
    if (dateFilter) {
      filtered = filtered.filter(stockOut =>
        stockOut.issued_at.startsWith(dateFilter)
      )
    }

    // 대여 필터
    if (rentalFilter !== 'all') {
      filtered = filtered.filter(stockOut =>
        rentalFilter === 'rental' ? stockOut.is_rental : !stockOut.is_rental
      )
    }

    setFilteredStockOuts(filtered)
  }, [searchTerm, dateFilter, rentalFilter, stockOuts])

  const loadStockOuts = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('stock_out')
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
        .order('issued_at', { ascending: false })

      if (error) throw error
      setStockOuts(data || [])
    } catch (error) {
      console.error('출고 이력 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setDateFilter('')
    setRentalFilter('all')
  }

  const displayStockOuts = searchTerm.trim() || dateFilter || rentalFilter !== 'all' ? filteredStockOuts : stockOuts

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            출고 이력
          </DialogTitle>
          <DialogDescription>
            전체 출고 이력을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 검색 및 필터 */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="품목명, 규격, 메이커, 출고자, 프로젝트, 사유, 비고로 검색..."
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
            <select
              value={rentalFilter}
              onChange={(e) => setRentalFilter(e.target.value as 'all' | 'rental' | 'normal')}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">전체</option>
              <option value="rental">대여</option>
              <option value="normal">일반출고</option>
            </select>
            {(searchTerm.trim() || dateFilter || rentalFilter !== 'all') && (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">출고수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">출고자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">출고일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">반납예정일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayStockOuts.map((stockOut) => (
                  <tr key={stockOut.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stockOut.item.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.item.specification || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.item.maker || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium text-blue-600">{stockOut.quantity}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.unit_price ? `₩${stockOut.unit_price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.total_amount ? `₩${stockOut.total_amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stockOut.is_rental 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stockOut.is_rental ? '대여' : '일반출고'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {stockOut.issued_by || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(stockOut.issued_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.project || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {stockOut.reason || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.is_rental && stockOut.return_date ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-blue-400" />
                          {new Date(stockOut.return_date).toLocaleDateString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockOut.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {displayStockOuts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {(searchTerm.trim() || dateFilter || rentalFilter !== 'all') ? '검색 결과가 없습니다.' : '출고 이력이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 통계 정보 */}
        {stockOuts.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">출고 통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <span className="text-gray-500">총 출고 건수:</span>
                <span className="ml-2 font-medium">{stockOuts.length}건</span>
              </div>
              <div>
                <span className="text-gray-500">총 출고 수량:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {stockOuts.reduce((sum, s) => sum + s.quantity, 0)}개
                </span>
              </div>
              <div>
                <span className="text-gray-500">총 출고 금액:</span>
                <span className="ml-2 font-medium text-blue-600">
                  ₩{stockOuts.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">대여 건수:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {stockOuts.filter(s => s.is_rental).length}건
                </span>
              </div>
              <div>
                <span className="text-gray-500">최근 출고:</span>
                <span className="ml-2 font-medium">
                  {stockOuts.length > 0 ? new Date(stockOuts[0].issued_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">검색 결과:</span>
                <span className="ml-2 font-medium">
                  {displayStockOuts.length}건
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