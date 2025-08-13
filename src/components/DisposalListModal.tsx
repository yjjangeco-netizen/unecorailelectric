'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, User, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Disposal, Item } from '@/lib/supabase'

interface DisposalListModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DisposalWithItem extends Disposal {
  item: Item
  stock_in: {
    received_at: string
    received_by: string
  }
}

export default function DisposalListModal({ isOpen, onClose }: DisposalListModalProps) {
  const [disposals, setDisposals] = useState<DisposalWithItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredDisposals, setFilteredDisposals] = useState<DisposalWithItem[]>([])

  useEffect(() => {
    if (isOpen) {
      loadDisposals()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = disposals.filter(disposal =>
        disposal.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disposal.item.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disposal.item.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disposal.disposed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disposal.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredDisposals(filtered)
    } else {
      setFilteredDisposals(disposals)
    }
  }, [searchTerm, disposals])

  const loadDisposals = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('disposal')
        .select(`
          *,
          item:items (
            id,
            name,
            specification,
            maker,
            purpose
          ),
          stock_in:stock_in (
            received_at,
            received_by
          )
        `)
        .order('disposed_at', { ascending: false })

      if (error) throw error
      setDisposals(data || [])
    } catch (error) {
      console.error('폐기 이력 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  const displayDisposals = searchTerm.trim() ? filteredDisposals : disposals

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            폐기 이력
          </DialogTitle>
          <DialogDescription>
            폐기된 품목들의 이력을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 검색 */}
        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="품목명, 규격, 메이커, 폐기자, 사유로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          {searchTerm.trim() && (
            <Button onClick={handleClearSearch} variant="outline" size="sm">
              해제
            </Button>
          )}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기사유</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고자</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayDisposals.map((disposal) => (
                  <tr key={disposal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {disposal.item.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {disposal.item.specification || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {disposal.item.maker || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium text-red-600">{disposal.quantity}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {disposal.disposed_by}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(disposal.disposed_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {disposal.reason || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(disposal.stock_in.received_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {disposal.stock_in.received_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {displayDisposals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trash2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {searchTerm.trim() ? '검색 결과가 없습니다.' : '폐기 이력이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 통계 정보 */}
        {disposals.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">폐기 통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">총 폐기 건수:</span>
                <span className="ml-2 font-medium">{disposals.length}건</span>
              </div>
              <div>
                <span className="text-gray-500">총 폐기 수량:</span>
                <span className="ml-2 font-medium text-red-600">
                  {disposals.reduce((sum, d) => sum + d.quantity, 0)}개
                </span>
              </div>
              <div>
                <span className="text-gray-500">최근 폐기:</span>
                <span className="ml-2 font-medium">
                  {disposals.length > 0 ? new Date(disposals[0].disposed_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">검색 결과:</span>
                <span className="ml-2 font-medium">
                  {displayDisposals.length}건
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