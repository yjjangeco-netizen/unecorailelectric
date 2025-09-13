'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import CommonHeader from '@/components/CommonHeader'

export default function TestPage() {
  const [stockStatuses, setStockStatuses] = useState<any[]>([])
  const [conditionTypes, setConditionTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string } | null>(null)

  useEffect(() => {
    checkDatabaseStatus()
    // 로그인 상태 확인
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setCurrentUser(userData)
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error)
      }
    }
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      setLoading(true)
      
      // items 테이블의 stock_status 확인
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('stock_status')
        .limit(100)
      
      if (itemsError) {
        console.error('items 조회 오류:', itemsError)
      } else {
        const statusCounts = itemsData.reduce((acc: any, item: any) => {
          const status = item.stock_status || 'unknown'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
        setStockStatuses(Object.entries(statusCounts).map(([status, count]) => ({ status, count })))
      }

      // stock_history 테이블의 condition_type 확인
      const { data: historyData, error: historyError } = await supabase
        .from('stock_history')
        .select('condition_type')
        .limit(100)
      
      if (historyError) {
        console.error('stock_history 조회 오류:', historyError)
      } else {
        const typeCounts = historyData.reduce((acc: any, item: any) => {
          const type = item.condition_type || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
        setConditionTypes(Object.entries(typeCounts).map(([type, count]) => ({ type, count })))
      }
    } catch (error) {
      console.error('데이터베이스 상태 확인 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 공통 헤더 추가 */}
      <CommonHeader
        currentUser={currentUser}
        isAdmin={currentUser?.role === 'admin'}
        title="데이터베이스 상태 확인"
        showBackButton={true}
        backUrl="/"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">데이터베이스 상태 확인</h1>
        
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">items.stock_status 분포</h2>
              <div className="bg-gray-100 p-4 rounded">
                {stockStatuses.length > 0 ? (
                  <ul className="space-y-2">
                    {stockStatuses.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span className="font-mono bg-white px-2 py-1 rounded">
                          {item.status || '(NULL)'}
                        </span>
                        <span className="text-blue-600 font-semibold">{item.count}개</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>데이터가 없습니다.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">stock_history.condition_type 분포</h2>
              <div className="bg-gray-100 p-4 rounded">
                {conditionTypes.length > 0 ? (
                  <ul className="space-y-2">
                    {conditionTypes.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span className="font-mono bg-white px-2 py-1 rounded">
                          {item.type || '(NULL)'}
                        </span>
                        <span className="text-blue-600 font-semibold">{item.count}개</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>데이터가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
