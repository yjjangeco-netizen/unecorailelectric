'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Package, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import SimpleStockInModal from './SimpleStockInModal'

// 간단한 재고 데이터 타입
interface SimpleStockItem {
  Index: number
  Name: string
  Spec: string
  Maker: string
  Location: string
  Remark: string
  Status: string
  In_data: number
  Out_data: number
  Plus_data: number
  Minus_data: number
  Disposal_qunty: number
  Total_qunty: number
  Unit_price: number
  updated_at: string
}

export default function SimpleStockTable() {
  const [stockItems, setStockItems] = useState<SimpleStockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false)

  // 재고 데이터 로드
  const loadStockData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('Current_Stock')
        .select('*')
        .order('Name')

      if (error) {
        throw error
      }

      setStockItems(data || [])
    } catch (error) {
      console.error('재고 데이터 로드 오류:', error)
      alert('재고 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStockData()
  }, [])

  // 입고 완료 후 데이터 새로고침
  const handleStockInComplete = () => {
    loadStockData()
  }

  // 총 재고량 계산
  const totalQuantity = stockItems.reduce((sum, item) => sum + item.Total_qunty, 0)
  const totalValue = stockItems.reduce((sum, item) => sum + (item.Total_qunty * item.Unit_price), 0)

  return (
    <div className="p-6 bg-white">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center">
            <Package className="h-8 w-8 mr-3 text-green-600" />
            간단한 재고 관리
          </h1>
          <p className="text-gray-600 mt-1">복잡한 관계 없이 단순하게 관리하는 재고 시스템</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={loadStockData}
            variant="outline"
            className="bg-white text-black border border-gray-300 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button
            onClick={() => setIsStockInModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            입고
          </Button>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-blue-600 text-sm font-medium">총 품목 수</div>
          <div className="text-2xl font-bold text-blue-800">{stockItems.length}개</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 text-sm font-medium">총 재고량</div>
          <div className="text-2xl font-bold text-green-800">{totalQuantity.toLocaleString()}개</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-purple-600 text-sm font-medium">총 재고 가치</div>
          <div className="text-2xl font-bold text-purple-800">₩{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* 재고 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품목명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  규격
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제조사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  위치
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재고
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비고
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    등록된 재고가 없습니다.
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.Index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.Name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.Spec || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.Maker || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.Location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.Total_qunty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₩{item.Unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.Status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.Status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.Remark || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 입고 모달 */}
      <SimpleStockInModal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        onSave={handleStockInComplete}
      />
    </div>
  )
}
