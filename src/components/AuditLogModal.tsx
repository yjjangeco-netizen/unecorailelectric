'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, Search, X, Eye } from 'lucide-react'

interface AuditLog {
  id: number
  action: string
  user_id: string
  timestamp: string
  details: {
    item_id: string
    edit_date: string
    old_data: any
    new_data: any
    changes: any
  }
}

interface AuditLogModalProps {
  isOpen: boolean
  onClose: () => void
  itemId?: string
}

export default function AuditLogModal({ 
  isOpen, 
  onClose, 
  itemId 
}: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 로그 조회
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      params.append('action', 'STOCK_EDIT')
      if (itemId) {
        params.append('item_id', itemId)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data || [])
      } else {
        setError(result.error || '로그 조회 실패')
      }
    } catch (error) {
      console.error('로그 조회 오류:', error)
      setError('로그 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [itemId])

  // 모달이 열릴 때 로그 조회
  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen, fetchLogs])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'STOCK_EDIT': return '재고 수정'
      default: return action
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {itemId ? '품목 수정 이력' : '전체 수정 이력'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4">
          {/* 새로고침 버튼 */}
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? '조회 중...' : '새로고침'}
            </Button>
            <div className="text-sm text-gray-500">
              총 {logs.length}건의 수정 이력
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 로그 목록 */}
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {loading ? '조회 중...' : '수정 이력이 없습니다.'}
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {getActionDisplay(log.action)}
                      </span>
                      <span className="text-sm text-gray-600">
                        사용자: {log.user_id || '시스템'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* 수정 전 */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-2">수정 전</h4>
                      <div className="space-y-1">
                        <div><span className="text-gray-600">품목명:</span> {log.details.old_data.product || '-'}</div>
                        <div><span className="text-gray-600">규격:</span> {log.details.old_data.spec || '-'}</div>
                        <div><span className="text-gray-600">위치:</span> {log.details.old_data.location || '-'}</div>
                        <div><span className="text-gray-600">수량:</span> {log.details.old_data.current_quantity || 0}</div>
                        <div><span className="text-gray-600">단가:</span> {log.details.old_data.unit_price || 0}</div>
                        <div><span className="text-gray-600">상태:</span> {log.details.old_data.stock_status || '-'}</div>
                      </div>
                    </div>

                    {/* 수정 후 */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-2">수정 후</h4>
                      <div className="space-y-1">
                        <div><span className="text-gray-600">품목명:</span> {log.details.new_data.product || '-'}</div>
                        <div><span className="text-gray-600">규격:</span> {log.details.new_data.spec || '-'}</div>
                        <div><span className="text-gray-600">위치:</span> {log.details.new_data.location || '-'}</div>
                        <div><span className="text-gray-600">수량:</span> {log.details.new_data.current_quantity || 0}</div>
                        <div><span className="text-gray-600">단가:</span> {log.details.new_data.unit_price || 0}</div>
                        <div><span className="text-gray-600">상태:</span> {log.details.new_data.stock_status || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* 변경 사항 요약 */}
                  {log.details.changes && Object.keys(log.details.changes).length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">주요 변경 사항</h4>
                      <div className="text-sm text-gray-600">
                        {Object.entries(log.details.changes).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
