'use client'

import { useState, useEffect } from 'react'
import { useStockQuery } from '@/hooks/useStockQuery'

export default function TestQuantityPage() {
  const { data: stockData, isLoading, error, refetch } = useStockQuery()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTest, setIsRunningTest] = useState(false)

  const runQuantityTest = async () => {
    setIsRunningTest(true)
    try {
      const response = await fetch('/api/test-quantity-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      setTestResults(result.testResults || [])
    } catch (error) {
      console.error('테스트 실행 오류:', error)
    } finally {
      setIsRunningTest(false)
    }
  }

  const fixCurrentQuantity = async () => {
    try {
      const response = await fetch('/api/fix-current-quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      alert(result.message)
      refetch()
    } catch (error) {
      console.error('수정 실행 오류:', error)
    }
  }

  if (isLoading) return <div className="p-4">로딩 중...</div>
  if (error) return <div className="p-4 text-red-500">오류: {error.message}</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">수량 계산 테스트</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={runQuantityTest}
          disabled={isRunningTest}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunningTest ? '테스트 중...' : '수량 계산 테스트 실행'}
        </button>
        
        <button
          onClick={fixCurrentQuantity}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          현재고 수정 실행
        </button>
        
        <button
          onClick={() => refetch()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          데이터 새로고침
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">테스트 결과</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b">품목명</th>
                  <th className="px-4 py-2 border-b">마감수량</th>
                  <th className="px-4 py-2 border-b">입고수량</th>
                  <th className="px-4 py-2 border-b">출고수량</th>
                  <th className="px-4 py-2 border-b">DB 현재고</th>
                  <th className="px-4 py-2 border-b">계산된 현재고</th>
                  <th className="px-4 py-2 border-b">차이</th>
                  <th className="px-4 py-2 border-b">상태</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((item, index) => (
                  <tr key={index} className={item.isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-4 py-2 border-b">{item.name}</td>
                    <td className="px-4 py-2 border-b text-center">{item.closing_quantity}</td>
                    <td className="px-4 py-2 border-b text-center">{item.stock_in}</td>
                    <td className="px-4 py-2 border-b text-center">{item.stock_out}</td>
                    <td className="px-4 py-2 border-b text-center font-mono">{item.db_current_quantity}</td>
                    <td className="px-4 py-2 border-b text-center font-mono">{item.calculated_current_quantity}</td>
                    <td className="px-4 py-2 border-b text-center font-mono">
                      {item.difference !== 0 && (
                        <span className={item.difference > 0 ? 'text-red-600' : 'text-blue-600'}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        item.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isCorrect ? '정상' : '오류'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">현재 재고 데이터 (처음 10개)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b">품목명</th>
                <th className="px-4 py-2 border-b">마감수량</th>
                <th className="px-4 py-2 border-b">입고수량</th>
                <th className="px-4 py-2 border-b">출고수량</th>
                <th className="px-4 py-2 border-b">현재고</th>
                <th className="px-4 py-2 border-b">계산식</th>
              </tr>
            </thead>
            <tbody>
              {stockData?.slice(0, 10).map((item: any) => {
                const calculated = (item.closing_quantity || 0) + (item.stock_in || 0) - (item.stock_out || 0)
                return (
                  <tr key={item.id} className={item.current_quantity === calculated ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-4 py-2 border-b">{item.product}</td>
                    <td className="px-4 py-2 border-b text-center">{item.closing_quantity || 0}</td>
                    <td className="px-4 py-2 border-b text-center">{item.stock_in || 0}</td>
                    <td className="px-4 py-2 border-b text-center">{item.stock_out || 0}</td>
                    <td className="px-4 py-2 border-b text-center font-mono">{item.current_quantity}</td>
                    <td className="px-4 py-2 border-b text-center text-sm">
                      {item.closing_quantity || 0} + {item.stock_in || 0} - {item.stock_out || 0} = {calculated}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
