'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Package, Plus, Minus, Search, Trash2, Save, Upload, Download } from 'lucide-react'
import { CurrentStock } from '@/lib/supabase'
import { log } from '@/lib/logger'

interface BulkStockOutRow {
  itemId: string
  itemName: string
  specification: string
  currentQuantity: number
  requestQuantity: number
  unitPrice: number
  totalAmount: number
  project: string
  notes: string
  isRental: boolean
  returnDate: string
}

interface BulkStockOutModalProps {
  isOpen: boolean
  onClose: () => void
  stockItems: CurrentStock[]
  onSave: (data: BulkStockOutRow[]) => Promise<void>
}

export default function BulkStockOutModal({ 
  isOpen, 
  onClose, 
  stockItems = [], 
  onSave 
}: BulkStockOutModalProps) {
  const [rows, setRows] = useState<BulkStockOutRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isProcessing, setSaving] = useState(false)
  const [selectedItems, setSelectedItems] = useState<CurrentStock[]>([])

  // 검색된 재고 아이템
  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.maker?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addRow = (item?: CurrentStock) => {
    const newRow: BulkStockOutRow = {
      itemId: item?.id || '',
      itemName: item?.name || '',
      specification: item?.specification || '',
      currentQuantity: item?.current_quantity || 0,
      requestQuantity: 1,
      unitPrice: item?.unit_price || 0,
      totalAmount: item?.unit_price || 0,
      project: '',
      notes: '',
      isRental: false,
      returnDate: ''
    }
    setRows([...rows, newRow])
  }

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof BulkStockOutRow, value: string | number | boolean) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    
    // 수량 변경 시 총액 재계산
    if (field === 'requestQuantity') {
      newRows[index].totalAmount = newRows[index].unitPrice * (value as number)
    }
    
    setRows(newRows)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 유효성 검사
      const validRows = rows.filter(row => 
        row.itemId && 
        row.requestQuantity > 0 && 
        row.requestQuantity <= row.currentQuantity
      )
      
      if (validRows.length === 0) {
        throw new Error('유효한 출고 항목이 없습니다')
      }

      // 재고 부족 체크
      const insufficientStock = validRows.filter(row => row.requestQuantity > row.currentQuantity)
      if (insufficientStock.length > 0) {
        throw new Error(`재고 부족: ${insufficientStock.map(r => r.itemName).join(', ')}`)
      }

      await onSave(validRows)
      onClose()
      setRows([])
      
    } catch (error) {
      log.error('대량 출고 저장 실패', 'BulkStockOutModal', error instanceof Error ? error : new Error(String(error)))
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const exportTemplate = () => {
    const headers = ['품목명', '규격', '현재재고', '출고수량', '단가', '프로젝트', '비고', '대여여부', '반납일']
    const csvContent = [
      headers.join(','),
      ...rows.map(row => [
        row.itemName,
        row.specification,
        row.currentQuantity,
        row.requestQuantity,
        row.unitPrice,
        row.project,
        row.notes,
        row.isRental ? '대여' : '일반',
        row.returnDate
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bulk_stock_out_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const totalQuantity = rows.reduce((sum, row) => sum + row.requestQuantity, 0)
  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-red-600" />
            <span>대량 출고</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 검색 및 제어 영역 */}
          <div className="flex flex-col space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="품목명, 규격, 메이커로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => addRow()} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                빈 행 추가
              </Button>
              <Button onClick={exportTemplate} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                템플릿
              </Button>
            </div>

            {/* 재고 검색 결과 */}
            {searchTerm && (
              <div className="max-h-32 overflow-y-auto border rounded bg-white">
                {filteredStockItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      addRow(item)
                      setSearchTerm('')
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-2">{item.specification}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        재고: {item.current_quantity}개 | ₩{item.unit_price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 출고 목록 */}
          <div className="space-y-2">
            {rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>출고할 품목을 추가해주세요</p>
              </div>
            ) : (
              <>
                {/* 헤더 */}
                <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 rounded text-sm font-medium">
                  <div className="col-span-2">품목명</div>
                  <div className="col-span-2">규격</div>
                  <div className="col-span-1">현재고</div>
                  <div className="col-span-1">출고수량</div>
                  <div className="col-span-1">단가</div>
                  <div className="col-span-1">총액</div>
                  <div className="col-span-2">프로젝트</div>
                  <div className="col-span-2">비고</div>
                  <div className="col-span-1">작업</div>
                </div>

                {/* 데이터 행들 */}
                {rows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2 border rounded hover:bg-gray-50">
                    <div className="col-span-2">
                      <Input
                        value={row.itemName}
                        onChange={(e) => updateRow(index, 'itemName', e.target.value)}
                        placeholder="품목명"
                        className="text-sm"
                        readOnly={!!row.itemId}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={row.specification}
                        onChange={(e) => updateRow(index, 'specification', e.target.value)}
                        placeholder="규격"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        value={row.currentQuantity}
                        readOnly
                        className="text-sm bg-gray-100"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={row.requestQuantity}
                        onChange={(e) => updateRow(index, 'requestQuantity', parseInt(e.target.value) || 0)}
                        min="1"
                        max={row.currentQuantity}
                        className={`text-sm ${row.requestQuantity > row.currentQuantity ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => updateRow(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        value={`₩${row.totalAmount.toLocaleString()}`}
                        readOnly
                        className="text-sm bg-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={row.project}
                        onChange={(e) => updateRow(index, 'project', e.target.value)}
                        placeholder="프로젝트명"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={row.notes}
                        onChange={(e) => updateRow(index, 'notes', e.target.value)}
                        placeholder="비고"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        onClick={() => removeRow(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 요약 */}
          {rows.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>총 {rows.length}개 품목</span>
                <span>총 수량: {totalQuantity}개</span>
                <span className="font-medium">총 금액: ₩{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-between border-t pt-4">
          <div>
            <Button onClick={onClose} variant="outline">
              취소
            </Button>
          </div>
          <div className="space-x-2">
            <Button
              onClick={handleSave}
              disabled={rows.length === 0 || isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  처리 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  출고 처리 ({rows.length}건)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 