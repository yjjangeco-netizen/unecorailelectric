'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package, Edit, Trash2, Calendar, User, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Item, StockIn, StockOut, Disposal } from '@/lib/supabase'

interface StockHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
}

interface StockHistory {
  id: string
  type: 'in' | 'out' | 'disposal'
  quantity: number
  date: string
  user: string
  project?: string
  reason?: string
  condition_type?: string
  is_rental?: boolean
  return_date?: string
  notes?: string
  record_type: 'stock_in' | 'stock_out' | 'disposal'
  record_id: string
}

export default function StockHistoryModal({ isOpen, onClose, itemId }: StockHistoryModalProps) {
  const [item, setItem] = useState<Item | null>(null)
  const [history, setHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StockHistory | null>(null)
  const [editForm, setEditForm] = useState({
    project: '',
    reason: '',
    notes: '',
    condition_type: '',
    is_rental: false,
    return_date: ''
  })

  useEffect(() => {
    if (isOpen && itemId) {
      loadItemAndHistory()
    }
  }, [isOpen, itemId])

  const loadItemAndHistory = async () => {
    try {
      setLoading(true)

      // 아이템 정보 로드
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError
      setItem(itemData)

      // 입고 이력 로드
      const { data: stockInData, error: stockInError } = await supabase
        .from('stock_in')
        .select('*')
        .eq('item_id', itemId)
        .order('received_at', { ascending: false })

      if (stockInError) throw stockInError

      // 출고 이력 로드
      const { data: stockOutData, error: stockOutError } = await supabase
        .from('stock_out')
        .select('*')
        .eq('item_id', itemId)
        .order('issued_at', { ascending: false })

      if (stockOutError) throw stockOutError

      // 폐기 이력 로드
      const { data: disposalData, error: disposalError } = await supabase
        .from('disposal')
        .select('*')
        .eq('item_id', itemId)
        .order('disposed_at', { ascending: false })

      if (disposalError) throw disposalError

      // 모든 이력을 하나의 배열로 합치고 날짜순으로 정렬
      const allHistory: StockHistory[] = [
        ...(stockInData || []).map((record): StockHistory => ({
          id: record.id,
          type: 'in',
          quantity: record.quantity,
          date: record.received_at,
          user: record.received_by || '',
          project: record.project,
          condition_type: record.condition_type,
          notes: record.notes,
          record_type: 'stock_in',
          record_id: record.id
        })),
        ...(stockOutData || []).map((record): StockHistory => ({
          id: record.id,
          type: 'out',
          quantity: record.quantity,
          date: record.issued_at,
          user: record.issued_by || '',
          project: record.project,
          reason: record.reason,
          is_rental: record.is_rental,
          return_date: record.return_date,
          notes: record.notes,
          record_type: 'stock_out',
          record_id: record.id
        })),
        ...(disposalData || []).map((record): StockHistory => ({
          id: record.id,
          type: 'disposal',
          quantity: record.quantity,
          date: record.disposed_at,
          user: record.disposed_by || '',
          reason: record.reason,
          notes: record.notes,
          record_type: 'disposal',
          record_id: record.id
        }))
      ]

      // 날짜순으로 정렬 (최신순)
      allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistory(allHistory)
    } catch (error) {
      console.error('이력 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: StockHistory) => {
    setEditingRecord(record)
    setEditForm({
      project: record.project || '',
      reason: record.reason || '',
      notes: record.notes || '',
      condition_type: record.condition_type || '',
      is_rental: record.is_rental || false,
      return_date: record.return_date || ''
    })
  }

  const handleSave = async () => {
    if (!editingRecord) return

    try {
      if (editingRecord.record_type === 'stock_in') {
        const { error } = await supabase
          .from('stock_in')
          .update({
            project: editForm.project,
            condition_type: editForm.condition_type,
            notes: editForm.notes
          })
          .eq('id', editingRecord.record_id)

        if (error) throw error
      } else if (editingRecord.record_type === 'stock_out') {
        const { error } = await supabase
          .from('stock_out')
          .update({
            project: editForm.project,
            reason: editForm.reason,
            is_rental: editForm.is_rental,
            return_date: editForm.is_rental ? editForm.return_date : null,
            notes: editForm.notes
          })
          .eq('id', editingRecord.record_id)

        if (error) throw error
      }

      await loadItemAndHistory()
      setEditingRecord(null)
    } catch (error) {
      console.error('수정 오류:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    setEditingRecord(null)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return '입고'
      case 'out': return '출고'
      case 'disposal': return '폐기'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'bg-green-100 text-green-800'
      case 'out': return 'bg-blue-100 text-blue-800'
      case 'disposal': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuantityColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600'
      case 'out': return 'text-blue-600'
      case 'disposal': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            재고 이력
          </DialogTitle>
          <DialogDescription>
            선택된 품목의 입고, 출고, 폐기 이력을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 아이템 정보 */}
            {item && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-3">품목 정보</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">품목명:</span>
                    <span className="ml-2 font-medium">{item.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">규격:</span>
                    <span className="ml-2">{item.specification || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">메이커:</span>
                    <span className="ml-2">{item.maker || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">용도:</span>
                    <span className="ml-2">{item.purpose || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 이력 목록 */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium">이력 목록</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리자</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유/비고</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(record.type)}`}>
                            {getTypeLabel(record.type)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${getQuantityColor(record.type)}`}>
                            {record.type === 'in' ? '+' : '-'}{record.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            {record.user}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.project || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1 text-gray-400" />
                            {record.reason || record.notes || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          {editingRecord?.id === record.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSave}
                                className="text-green-600 hover:text-green-900"
                                title="저장"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-gray-600 hover:text-gray-900"
                                title="취소"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              {record.record_type !== 'disposal' && (
                                <button
                                  onClick={() => handleEdit(record)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="수정"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {history.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>이력이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 편집 폼 */}
            {editingRecord && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-md font-medium mb-4">
                  {getTypeLabel(editingRecord.type)} 정보 수정
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
                    <input
                      type="text"
                      value={editForm.project}
                      onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {editingRecord.record_type === 'stock_in' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                      <select
                        value={editForm.condition_type}
                        onChange={(e) => setEditForm({ ...editForm, condition_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="new">신품</option>
                        <option value="used_good">양호</option>
                        <option value="used_defective">불량</option>
                        <option value="unknown">미상</option>
                      </select>
                    </div>
                  )}
                  {editingRecord.record_type === 'stock_out' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
                        <input
                          type="text"
                          value={editForm.reason}
                          onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_rental"
                          checked={editForm.is_rental}
                          onChange={(e) => setEditForm({ ...editForm, is_rental: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_rental" className="text-sm font-medium text-gray-700">
                          대여
                        </label>
                      </div>
                      {editForm.is_rental && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">반납 예정일</label>
                          <input
                            type="date"
                            value={editForm.return_date}
                            onChange={(e) => setEditForm({ ...editForm, return_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                닫기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 