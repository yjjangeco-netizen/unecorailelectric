'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package, Calendar, User, FileText, Clock, Trash2, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StockIn, StockOut, Disposal, Item } from '@/lib/supabase'

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StockInWithItem extends StockIn {
  item: Item
}

interface StockOutWithItem extends StockOut {
  item: Item
}

interface DisposalWithItem extends Disposal {
  item: Item
  stock_in: {
    received_at: string
    received_by: string
  }
}

interface HistoryItem {
  id: string
  type: 'stock_in' | 'stock_out' | 'disposal'
  date: string
  item: Item
  quantity: number
  user: string
  project?: string
  reason?: string
  notes?: string
  condition_type?: string
  is_rental?: boolean
  return_date?: string
  disposed_by?: string
  original_data: StockInWithItem | StockOutWithItem | DisposalWithItem
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // 체크박스 상태
  const [selectedTypes, setSelectedTypes] = useState({
    stock_in: true,
    stock_out: true,
    disposal: true,
    rental: true
  })

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  useEffect(() => {
    let filtered = historyItems

    // 타입 필터
    filtered = filtered.filter(item => {
      if (item.type === 'stock_in' && !selectedTypes.stock_in) return false
      if (item.type === 'stock_out' && !selectedTypes.stock_out) return false
      if (item.type === 'disposal' && !selectedTypes.disposal) return false
      if (item.type === 'stock_out' && item.is_rental && !selectedTypes.rental) return false
      return true
    })

    // 검색어 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 날짜 범위 필터
    if (startDate) {
      filtered = filtered.filter(item => item.date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(item => item.date <= endDate)
    }

    setFilteredItems(filtered)
  }, [searchTerm, startDate, endDate, selectedTypes, historyItems])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const allItems: HistoryItem[] = []

      // 입고 이력 로드
      if (selectedTypes.stock_in) {
        const { data: stockInData } = await supabase
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

        if (stockInData) {
          stockInData.forEach(item => {
            allItems.push({
              id: item.id,
              type: 'stock_in',
              date: item.received_at,
              item: item.item,
              quantity: item.quantity,
              user: item.received_by || '',
              project: item.project,
              notes: item.notes,
              condition_type: item.condition_type,
              original_data: item
            })
          })
        }
      }

      // 출고 이력 로드
      if (selectedTypes.stock_out) {
        const { data: stockOutData } = await supabase
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

        if (stockOutData) {
          stockOutData.forEach(item => {
            allItems.push({
              id: item.id,
              type: 'stock_out',
              date: item.issued_at,
              item: item.item,
              quantity: item.quantity,
              user: item.issued_by || '',
              project: item.project,
              reason: item.reason,
              notes: item.notes,
              is_rental: item.is_rental,
              return_date: item.return_date,
              original_data: item
            })
          })
        }
      }

      // 폐기 이력 로드
      if (selectedTypes.disposal) {
        const { data: disposalData } = await supabase
          .from('disposal')
          .select(`
            *,
            item:items (
              id,
              name,
              specification,
              maker,
              purpose,
              unit_price
            ),
            stock_in:stock_in (
              received_at,
              received_by
            )
          `)
          .order('disposed_at', { ascending: false })

        if (disposalData) {
          disposalData.forEach(item => {
            allItems.push({
              id: item.id,
              type: 'disposal',
              date: item.disposed_at,
              item: item.item,
              quantity: item.quantity,
              user: item.disposed_by || '',
              reason: item.reason,
              notes: item.notes,
              disposed_by: item.disposed_by,
              original_data: item
            })
          })
        }
      }

      // 날짜순으로 정렬
      allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistoryItems(allItems)
    } catch (error) {
      console.error('이력 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: keyof typeof selectedTypes) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSelectedTypes({
      stock_in: true,
      stock_out: true,
      disposal: true,
      rental: true
    })
  }

  const getTypeLabel = (item: HistoryItem) => {
    if (item.type === 'stock_in') return '입고'
    if (item.type === 'stock_out') {
      return item.is_rental ? '대여' : '출고'
    }
    if (item.type === 'disposal') return '폐기'
    return '기타'
  }

  const getTypeColor = (item: HistoryItem) => {
    if (item.type === 'stock_in') return 'bg-green-100 text-green-800'
    if (item.type === 'stock_out') {
      return item.is_rental ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
    }
    if (item.type === 'disposal') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getQuantityColor = (item: HistoryItem) => {
    if (item.type === 'stock_in') return 'text-green-600'
    if (item.type === 'stock_out') return 'text-blue-600'
    if (item.type === 'disposal') return 'text-red-600'
    return 'text-gray-600'
  }

  const displayItems = searchTerm.trim() || startDate || endDate || 
    !selectedTypes.stock_in || !selectedTypes.stock_out || !selectedTypes.disposal || !selectedTypes.rental
    ? filteredItems : historyItems

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1400px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            통합 이력 조회
          </DialogTitle>
          <DialogDescription>
            입고, 출고, 폐기, 대여 이력을 통합하여 조회할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 필터 옵션 */}
        <div className="space-y-4">
          {/* 타입 선택 */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTypes.stock_in}
                onChange={() => handleTypeChange('stock_in')}
                className="rounded"
              />
              <span className="text-sm font-medium">입고</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTypes.stock_out}
                onChange={() => handleTypeChange('stock_out')}
                className="rounded"
              />
              <span className="text-sm font-medium">출고</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTypes.rental}
                onChange={() => handleTypeChange('rental')}
                className="rounded"
              />
              <span className="text-sm font-medium">대여</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTypes.disposal}
                onChange={() => handleTypeChange('disposal')}
                className="rounded"
              />
              <span className="text-sm font-medium">폐기</span>
            </label>
          </div>

          {/* 검색 및 날짜 필터 */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="품목명, 규격, 메이커, 사용자, 프로젝트, 사유, 비고로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              placeholder="시작일"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              placeholder="종료일"
            />
            {(searchTerm.trim() || startDate || endDate || 
              !selectedTypes.stock_in || !selectedTypes.stock_out || !selectedTypes.disposal || !selectedTypes.rental) && (
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                필터 해제
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">규격</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메이커</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">비고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">추가정보</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item)}`}>
                        {getTypeLabel(item)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.item.specification || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.item.maker || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`font-medium ${getQuantityColor(item)}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {item.user || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.project || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {item.reason || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.notes || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.type === 'stock_in' && item.condition_type && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.condition_type === 'new' ? 'bg-green-100 text-green-800' :
                          item.condition_type === 'used_good' ? 'bg-blue-100 text-blue-800' :
                          item.condition_type === 'used_defective' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.condition_type === 'new' ? '신품' :
                           item.condition_type === 'used_good' ? '양호' :
                           item.condition_type === 'used_defective' ? '불량' : '미상'}
                        </span>
                      )}
                      {item.type === 'stock_out' && item.is_rental && item.return_date && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-blue-400" />
                          {new Date(item.return_date).toLocaleDateString()}
                        </div>
                      )}
                      {item.type === 'disposal' && item.disposed_by && (
                        <span className="text-red-600 text-xs">폐기자: {item.disposed_by}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {displayItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {(searchTerm.trim() || startDate || endDate || 
                    !selectedTypes.stock_in || !selectedTypes.stock_out || !selectedTypes.disposal || !selectedTypes.rental) 
                    ? '검색 결과가 없습니다.' : '이력이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 통계 정보 */}
        {historyItems.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">이력 통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <span className="text-gray-500">총 이력 건수:</span>
                <span className="ml-2 font-medium">{historyItems.length}건</span>
              </div>
              <div>
                <span className="text-gray-500">입고 건수:</span>
                <span className="ml-2 font-medium text-green-600">
                  {historyItems.filter(item => item.type === 'stock_in').length}건
                </span>
              </div>
              <div>
                <span className="text-gray-500">출고 건수:</span>
                <span className="ml-2 font-medium text-orange-600">
                  {historyItems.filter(item => item.type === 'stock_out' && !item.is_rental).length}건
                </span>
              </div>
              <div>
                <span className="text-gray-500">대여 건수:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {historyItems.filter(item => item.type === 'stock_out' && item.is_rental).length}건
                </span>
              </div>
              <div>
                <span className="text-gray-500">폐기 건수:</span>
                <span className="ml-2 font-medium text-red-600">
                  {historyItems.filter(item => item.type === 'disposal').length}건
                </span>
              </div>
              <div>
                <span className="text-gray-500">검색 결과:</span>
                <span className="ml-2 font-medium">
                  {displayItems.length}건
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