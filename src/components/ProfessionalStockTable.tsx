'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Package, Plus, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import ProfessionalStockInModal from './ProfessionalStockInModal'
import StockStatusDisplay from './StockStatusDisplay'
import { getStockStatusDisplay, isValidStockStatus } from '@/lib/stockStatusTypes'
import { useStockQuery } from '@/hooks/useStockQuery'

// 전문적인 재고 데이터 타입 (items 테이블 기반)
interface ProfessionalStockItem {
  id: number
  name: string
  specification: string
  maker: string
  location: string
  status: string
  stock_status: string
  note: string
  unit_price: number
  current_quantity: number
  stock_in: number
  stock_out: number
  total_qunty: number
  date_index?: string
}

export default function ProfessionalStockTable() {
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false)
  
  // useStockQuery 훅 사용
  const { data: stockData, isLoading, error, refetch } = useStockQuery('name')

  // 강력한 디버깅 로그 추가
  useEffect(() => {
    console.log('🚀 === ProfessionalStockTable 컴포넌트 마운트 ===')
    console.log('📊 stockData:', stockData)
    console.log('❌ error:', error)
    console.log('⏳ isLoading:', isLoading)
    console.log('🔍 stockData 타입:', typeof stockData)
    console.log('🔍 stockData 길이:', stockData?.length)
    
    if (stockData && stockData.length > 0) {
      console.log('📋 첫 번째 아이템:', stockData[0])
      console.log('🔑 첫 번째 아이템의 키들:', Object.keys(stockData[0] || {}))
    }
  }, [stockData, error, isLoading])

  // ProfessionalStockItem 형태로 데이터 변환
  const stockItems: ProfessionalStockItem[] = (stockData || []).map((item: any) => {
    // 수량 값들 추출
    const stockIn = Number(item.stock_in) || 0
    const stockOut = Number(item.stock_out) || 0
    const closingQuantity = Number(item.closing_quantity) || 0
    
    // 현재고 계산: 현재고 = 마감수량 + 입고수량 - 출고수량 (통일된 공식)
    const calculatedCurrentQuantity = closingQuantity + stockIn - stockOut
    
    return {
      id: item.id,
      name: item.product || '',
      specification: item.spec || '',
      maker: item.maker || '',
      location: item.location || '창고A',
      status: 'active',
      stock_status: item.stock_status || 'new',
      note: item.note || '',
      unit_price: Number(item.unit_price) || 0,
      current_quantity: calculatedCurrentQuantity, // 항상 계산된 현재고 사용
      stock_in: stockIn,
      stock_out: stockOut,
      total_qunty: calculatedCurrentQuantity, // total_qunty도 계산된 현재고로 설정
      date_index: ''
    }
  })

  // 입고 완료 후 데이터 새로고침
  const handleStockInComplete = () => {
    refetch()
  }

  // current_quantity 수정 함수
  const handleFixCurrentQuantity = async () => {
    try {
      const response = await fetch('/api/fix-current-quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ ${result.message}\n수정된 항목: ${result.fixedCount}개`)
        refetch() // 데이터 새로고침
      } else {
        alert(`❌ 수정 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('current_quantity 수정 오류:', error)
      alert('❌ 수정 중 오류가 발생했습니다.')
    }
  }

  // 총 재고량 및 가치 계산
  const totalQuantity = stockItems.reduce((sum, item) => sum + item.current_quantity, 0)
  const totalValue = stockItems.reduce((sum, item) => sum + (item.current_quantity * item.unit_price), 0)
  const activeItems = stockItems.filter(item => item.status === 'active').length
  const lowStockItems = stockItems.filter(item => item.current_quantity <= 10).length

  // 재고 상태에 따른 색상 및 아이콘
  const getStockLevelDisplay = (item: ProfessionalStockItem) => {
    if (item.current_quantity === 0) {
      return {
        color: 'bg-red-100 text-red-800',
        icon: <AlertTriangle className="h-3 w-3" />,
        text: '재고없음'
      }
    } else if (item.current_quantity <= 10) {
      return {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <TrendingDown className="h-3 w-3" />,
        text: '재고부족'
      }
    } else {
      return {
        color: 'bg-green-100 text-green-800',
        icon: <TrendingUp className="h-3 w-3" />,
        text: '정상'
      }
    }
  }

  // 품목 상태를 한글로 표시 (개선된 버전)
  const getItemStatusDisplay = (stockStatus: string): string => {
    // stockStatusTypes.ts의 표시 함수 사용
    if (stockStatus && isValidStockStatus(stockStatus)) {
      return getStockStatusDisplay(stockStatus);
    }
    
    // 유효하지 않은 상태값은 '알 수 없음' 반환
    console.warn(`유효하지 않은 stockStatus: "${stockStatus}", "알 수 없음" 반환`);
    return '알 수 없음';
  }

  return (
    <div className="p-6 bg-white">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center">
            <Package className="h-8 w-8 mr-3 text-blue-600" />
            전문적인 재고 관리 시스템
          </h1>
          <p className="text-gray-600 mt-1">SQLite 기반의 체계적이고 전문적인 재고 관리</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="bg-white text-black border border-gray-300 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button
            onClick={handleFixCurrentQuantity}
            variant="outline"
            className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
          >
            <Package className="h-4 w-4 mr-2" />
            재고 계산 수정
          </Button>
          <Button
            onClick={() => setIsStockInModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            전문적인 입고
          </Button>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-blue-600 text-sm font-medium">총 품목 수</div>
          <div className="text-2xl font-bold text-blue-800">{stockItems.length}개</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 text-sm font-medium">활성 품목</div>
          <div className="text-2xl font-bold text-green-800">{activeItems}개</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-purple-600 text-sm font-medium">총 재고량</div>
          <div className="text-2xl font-bold text-purple-800">{totalQuantity.toLocaleString()}개</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-orange-600 text-sm font-medium">재고 부족</div>
          <div className="text-2xl font-bold text-orange-800">{lowStockItems}개</div>
        </div>
      </div>

      {/* 총 재고 가치 */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="text-center">
          <div className="text-gray-600 text-sm font-medium">총 재고 가치</div>
          <div className="text-3xl font-bold text-gray-800">₩{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* 전문적인 재고 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
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
                  입고
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  출고
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재고
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  재고상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품목 품질상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비고
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    전문적인 재고 데이터를 불러오는 중...
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    등록된 전문적인 재고가 없습니다.
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => {
                  const stockStatus = getStockLevelDisplay(item)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {item.date_index || `#${item.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.specification || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.maker || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {item.stock_in.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {item.stock_out.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {item.current_quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₩{item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.icon}
                          <span className="ml-1">{stockStatus.text}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StockStatusDisplay 
                          status={item.stock_status} 
                          showIcon={true}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.note || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">💡 전문적인 재고 관리 시스템 특징:</div>
          <ul className="space-y-1 text-blue-700">
            <li>• <strong>기본키 기반:</strong> ItemID로 고유 식별, 같은 품목+규격도 여러 번 입고 가능</li>
            <li>• <strong>뷰 기반 현재고:</strong> 실시간으로 입출고 이력을 계산하여 정확한 현재고 표시</li>
            <li>• <strong>트리거 보안:</strong> 음수 재고 방지 및 데이터 무결성 보장</li>
            <li>• <strong>이벤트 기반:</strong> IN, OUT, PLUS, MINUS, DISPOSAL 등 모든 재고 변동 추적</li>
          </ul>
        </div>
      </div>

      {/* 전문적인 입고 모달 */}
      <ProfessionalStockInModal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        onSave={handleStockInComplete}
      />
    </div>
  )
}
