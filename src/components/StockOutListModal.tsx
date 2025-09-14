'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Package, Search, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { StockOut, Item } from '@/lib/types'

interface StockOutListModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CurrentStockWithItem {
  id: number
  item_id: number
  current_quantity: number
  closing_quantity: number
  location: string
  note: string
  item: Item
}

export default function StockOutListModal({ isOpen, onClose }: StockOutListModalProps) {
  const [stockOuts, setStockOuts] = useState<CurrentStockWithItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStockOuts, setFilteredStockOuts] = useState<CurrentStockWithItem[]>([])
  
  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingStockOut, setEditingStockOut] = useState<CurrentStockWithItem | null>(null)
  const [editForm, setEditForm] = useState({
    unit_price: 0,
    stock_status: 'new',
    location: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadStockOuts()
    }
  }, [isOpen])

  // 검색 및 필터링
  useEffect(() => {
    let filtered = stockOuts

    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(stock => 
        stock.item?.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.item?.spec?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.item?.maker?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredStockOuts(filtered)
  }, [stockOuts, searchTerm])

  // 전체 재고 데이터 로딩
  const loadStockOuts = async () => {
    setLoading(true)
    try {
      console.log('재고 데이터 로딩 시작...')
      
      // items 테이블에서 전체 재고 현황 조회
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          current_quantity,
          closing_quantity,
          location,
          note,
          product,
          spec,
          maker,
          unit_price,
          stock_status
        `)
        .order('id')

      if (error) {
        console.error('재고 데이터 로딩 오류:', error)
        throw error
      }

      console.log('로딩된 데이터:', data)

      // 타입 변환하여 저장 (VIEW에서 직접 데이터 가져옴)
      const typedData: CurrentStockWithItem[] = (data || []).map((item: any) => ({
        id: item.id,
        item_id: item.id, // VIEW에서는 id가 item_id 역할
        current_quantity: item.current_quantity,
        closing_quantity: item.closing_quantity,
        location: item.location || '',
        note: item.note || '',
        item: {
          id: item.id,
          product: item.product,
          spec: item.spec,
          maker: item.maker,
          unit_price: item.unit_price,
          stock_status: item.stock_status,
          purpose: item.purpose || '',
          min_stock: item.min_stock || 0,
          category: item.category || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }
      }))

      setStockOuts(typedData)
      setFilteredStockOuts(typedData)
      console.log('처리된 데이터:', typedData)
    } catch (error) {
      console.error('재고 데이터 로딩 실패:', error)
      alert('재고 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 검색 해제
  const handleClearSearch = () => {
    setSearchTerm('')
  }

  const handleEditStockOut = (stockOut: CurrentStockWithItem) => {
    setEditingStockOut(stockOut)
    setEditForm({
      unit_price: stockOut.item?.unit_price || 0,
      stock_status: stockOut.item?.stock_status || 'new',
      location: stockOut.location || ''
    })
    setIsEditModalOpen(true)
  }

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingStockOut) return

    try {
      // items 테이블만 업데이트 (통합된 테이블)
      const { error: itemError } = await (supabase as any)
        .from('items')
        .update({
          unit_price: editForm.unit_price,
          stock_status: editForm.stock_status,
          location: editForm.location
        })
        .eq('id', editingStockOut.item_id)

      if (itemError) throw itemError

      alert('수정이 완료되었습니다.')
      setIsEditModalOpen(false)
      setEditingStockOut(null)
      loadStockOuts() // 목록 새로고침
    } catch (error) {
      console.error('수정 오류:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const displayStockOuts = searchTerm.trim() ? filteredStockOuts : stockOuts

  // 상태 표시 텍스트 및 스타일
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'new':
        return { text: '신품', className: 'bg-green-100 text-green-800' }
      case 'almostnew':
        return { text: '중고신품', className: 'bg-blue-100 text-blue-800' }
      case 'used':
        return { text: '중고사용품', className: 'bg-orange-100 text-orange-800' }
      case 'breakdown':
        return { text: '고장', className: 'bg-red-100 text-red-800' }
      default:
        return { text: '알 수 없음', className: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            전체 재고 현황
          </DialogTitle>
          <DialogDescription>
            전체 재고 현황을 확인하고 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 검색 및 필터 */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="품명, 규격, 재질(MAKER)로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {searchTerm.trim() && (
              <Button onClick={handleClearSearch} variant="outline" size="sm">
                검색 해제
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">규격</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">재질(MAKER)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보유재고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">변경</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayStockOuts.map((stockOut, index) => {
                  const statusInfo = getStatusDisplay(stockOut.item?.stock_status || 'new')
                  const needsWork = stockOut.item?.stock_status !== 'new'
                  
                  return (
                    <tr key={stockOut.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {stockOut.item?.product || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stockOut.item?.spec || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stockOut.item?.maker || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stockOut.closing_quantity || 0}개
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                          {needsWork && (
                            <Wrench className="h-4 w-4 text-orange-500" aria-label="작업 필요" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button
                          onClick={() => handleEditStockOut(stockOut)}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                        >
                          수정
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {displayStockOuts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {searchTerm.trim() ? '검색 결과가 없습니다.' : '재고가 없습니다.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 통계 정보 */}
        {stockOuts.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">재고 통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">총 품목 수:</span>
                <span className="ml-2 font-medium">{stockOuts.length}개</span>
              </div>
              <div>
                <span className="text-gray-500">총 재고 수량:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {stockOuts.reduce((sum, s) => sum + s.current_quantity, 0)}개
                </span>
              </div>
              <div>
                <span className="text-gray-500">작업 필요:</span>
                <span className="ml-2 font-medium text-orange-600">
                  {stockOuts.filter(s => s.item?.stock_status !== 'new').length}개
                </span>
              </div>
              <div>
                <span className="text-gray-500">검색 결과:</span>
                <span className="ml-2 font-medium">
                  {displayStockOuts.length}개
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

      {/* 수정 모달 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>품목 정보 수정</DialogTitle>
            <DialogDescription>
              단가, 품목상태, 위치를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단가
              </label>
              <input
                type="number"
                value={editForm.unit_price}
                onChange={(e) => setEditForm({...editForm, unit_price: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                품목상태
              </label>
              <select
                value={editForm.stock_status}
                onChange={(e) => setEditForm({...editForm, stock_status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">신품</option>
                <option value="almostnew">중고신품</option>
                <option value="used">중고사용품</option>
                <option value="breakdown">고장</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                위치
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="재고 위치를 입력하세요"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button onClick={() => setIsEditModalOpen(false)} variant="outline">
                취소
              </Button>
              <Button onClick={handleSaveEdit}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
} 