'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StockIn, Item, supabase } from '@/lib/supabase'
import { Plus, Trash2, Download, Upload, Calendar, Copy, ArrowUp, ArrowDown, CheckSquare, Square } from 'lucide-react'

interface BulkStockInRow {
  name: string           // 품명
  specification: string   // 규격
  maker: string          // 메이커
  unit_price: number     // 금액
  purpose: string        // 용도
  quantity: number       // 입고수량
  condition_type: 'new' | 'used_good' | 'used_defective' | 'unknown'
  reason: string
  ordered_by: string
  received_by: string
  received_date: string  // 입고일
}

interface BulkStockInModalProps {
  isOpen: boolean
  onClose: () => void
  items: Item[]
  onSave: (stockInData: Omit<StockIn, 'id'>) => Promise<void>
}

export default function BulkStockInModal({ isOpen, onClose, items, onSave }: BulkStockInModalProps) {
  const [rows, setRows] = useState<BulkStockInRow[]>([
    {
      name: '',
      specification: '',
      maker: '',
      unit_price: 0,
      purpose: '',
      quantity: 0,
      condition_type: 'new',
      reason: '',
      ordered_by: '',
      received_by: '',
      received_date: new Date().toISOString().split('T')[0] || ''
    }
  ])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  // 데이터 형식 검증 함수
  const validateRow = (row: BulkStockInRow) => {
    const errors: { [key: string]: string } = {}
    
    // 필수 필드 검증
    if (!row.name.trim()) {
      errors.name = '품명은 필수입니다.'
    }
    if (!row.specification.trim()) {
      errors.specification = '규격은 필수입니다.'
    }
    if (!row.maker.trim()) {
      errors.maker = '메이커는 필수입니다.'
    }
    if (row.quantity <= 0) {
      errors.quantity = '수량은 0보다 커야 합니다.'
    }
    if (!row.condition_type) {
      errors.condition_type = '상태는 필수입니다.'
    }
    if (!row.received_by.trim()) {
      errors.received_by = '입고자는 필수입니다.'
    }
    if (!row.received_date) {
      errors.received_date = '입고일은 필수입니다.'
    }
    
    // 날짜 형식 검증
    if (row.received_date) {
      const date = new Date(row.received_date)
      if (isNaN(date.getTime())) {
        errors.received_date = '올바른 날짜 형식이 아닙니다.'
      }
    }
    
    // 수량 형식 검증
    if (row.quantity < 0) {
      errors.quantity = '수량은 음수일 수 없습니다.'
    }
    
    return errors
  }

  // 모든 행의 오류 상태 계산
  const getRowErrors = (index: number) => {
    const row = rows[index]
    if (!row) {return {}}
    return validateRow(row)
  }

  // 오류가 있는 행이 있는지 확인
  const hasErrors = () => {
    return rows.some((row) => Object.keys(validateRow(row)).length > 0)
  }

  // 오류가 있는 필드의 스타일 클래스
  const getErrorStyle = (field: string, index: number) => {
    const errors = getRowErrors(index)
    return errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }

  const addRow = () => {
    setRows([...rows, {
      name: '',
      specification: '',
      maker: '',
      unit_price: 0,
      purpose: '',
      quantity: 0,
      condition_type: 'new',
      reason: '',
      ordered_by: '',
      received_by: '',
      received_date: new Date().toISOString().split('T')[0] || ''
    }])
  }

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index))
      // 선택된 행도 업데이트
      const newSelected = new Set(selectedRows)
      newSelected.delete(index)
      // 인덱스가 변경된 행들의 선택 상태 업데이트
      const updatedSelected = new Set<number>()
      newSelected.forEach(selectedIndex => {
        if (selectedIndex > index) {
          updatedSelected.add(selectedIndex - 1)
        } else {
          updatedSelected.add(selectedIndex)
        }
      })
      setSelectedRows(updatedSelected)
    }
  }

  const duplicateRow = (index: number) => {
    const originalRow = rows[index]
    if (!originalRow) {return}
    
    const newRow = { 
      ...originalRow,
      name: originalRow.name || '',
      specification: originalRow.specification || '',
      maker: originalRow.maker || '',
      unit_price: originalRow.unit_price || 0,
      purpose: originalRow.purpose || '',
      quantity: originalRow.quantity || 0,
      condition_type: originalRow.condition_type || 'new',
      reason: originalRow.reason || '',
      ordered_by: originalRow.ordered_by || '',
      received_by: originalRow.received_by || '',
      received_date: originalRow.received_date || new Date().toISOString().split('T')[0] || ''
    }
    const newRows = [...rows]
    newRows.splice(index + 1, 0, newRow)
    setRows(newRows)
  }

  const moveRow = (fromIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && fromIndex === 0) {return}
    if (direction === 'down' && fromIndex === rows.length - 1) {return}

    const newRows = [...rows]
    const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    const sourceRow = newRows[fromIndex]
    const targetRow = newRows[targetIndex]
    
    if (!sourceRow || !targetRow) {return}
    
    newRows[fromIndex] = targetRow
    newRows[targetIndex] = sourceRow
    setRows(newRows)
  }

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const selectAllRows = () => {
    const allIndices = new Set(rows.map((_, index) => index))
    setSelectedRows(allIndices)
  }

  const clearSelection = () => {
    setSelectedRows(new Set())
  }

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) {return}
    if (rows.length - selectedRows.size < 1) {
      alert('최소 하나의 행은 남겨두어야 합니다.')
      return
    }
    setRows(rows.filter((_, index) => !selectedRows.has(index)))
    setSelectedRows(new Set())
  }

  const updateRow = (index: number, field: keyof BulkStockInRow, value: string | number) => {
    const newRows = [...rows]
    const currentRow = newRows[index]
    if (!currentRow) {return}
    
    newRows[index] = { ...currentRow, [field]: value }
    setRows(newRows)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 입고 처리 시작
      
      // 유효한 행만 필터링
      const validRows = rows.filter(row => 
        row.name.trim() && 
        row.specification.trim() &&
        row.maker.trim() &&
        row.quantity > 0 && 
        row.condition_type &&
        row.received_by.trim() &&
        row.received_date
      )
      
      // 유효한 행들 필터링 완료

      if (validRows.length === 0) {
        alert('최소 하나의 유효한 항목을 입력해주세요.')
        return
      }

      // 각 행을 처리
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i]
        // 행 처리 중
        
        // 기존 품목이 있는지 확인
        const existingItem = items.find(item => 
          item.name.toLowerCase() === (row?.name || '').toLowerCase() &&
          item.specification.toLowerCase() === (row?.specification || '').toLowerCase()
        )
        
        // 기존 품목 검색 완료

        let itemId: string

        if (existingItem) {
          // 기존 품목이 있으면 해당 품목 사용
          itemId = existingItem.id
          // 기존 품목 사용
        } else {
          // 새 품목 생성
          // 새 품목 생성
          try {
            const { data: newItem, error: itemError } = await supabase
              .from('items')
              .insert([{
                name: row?.name || '',
                specification: row?.specification || '',
                maker: row?.maker || '',
                unit_price: row?.unit_price || 0,
                purpose: row?.purpose || '',
                min_stock: 0,
                category: '',
                description: ''
              }])
              .select()
              .single()

            if (itemError) {
              console.error('품목 생성 오류 상세:', itemError)
              throw new Error(`품목 생성 실패: ${itemError.message}`)
            }
            
            if (!newItem) {
              throw new Error('품목 생성 후 데이터를 받지 못했습니다.')
            }
            
            itemId = newItem.id
            // 새 품목 생성 완료
          } catch (itemCreateError: unknown) {
            console.error('품목 생성 중 예외 발생:', itemCreateError)
            const errorMessage = itemCreateError instanceof Error ? itemCreateError.message : '알 수 없는 오류'
            throw new Error(`품목 생성 중 오류: ${errorMessage}`)
          }
        }

        // 입고 기록 생성
        // 입고 기록 생성
        const stockInData = {
          item_id: itemId,
          quantity: row?.quantity || 0,
          unit_price: row?.unit_price || 0,
          condition_type: row?.condition_type || 'new',
          reason: row?.reason || '',
          ordered_by: row?.ordered_by || '',
          received_by: row?.received_by || '',
          received_at: new Date(row?.received_date || new Date().toISOString().split('T')[0] || '').toISOString()
        }
        // 입고 데이터 준비 완료
        
        try {
          await onSave(stockInData)
          // 행 처리 완료
        } catch (saveError: unknown) {
          console.error(`행 ${i + 1} 저장 오류:`, saveError)
          const errorMessage = saveError instanceof Error ? saveError.message : '알 수 없는 오류'
          throw new Error(`입고 기록 저장 실패: ${errorMessage}`)
        }
      }

      // 모든 입고 처리 완료
      onClose()
      setRows([{
        name: '',
        specification: '',
        maker: '',
        unit_price: 0,
        purpose: '',
        quantity: 0,
        condition_type: 'new',
        reason: '',
        ordered_by: '',
        received_by: '',
        received_date: new Date().toISOString().split('T')[0] || ''
      }])
    } catch (error: unknown) {
      console.error('대량 입고 저장 오류:', error)
      console.error('오류 상세 정보:', {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        error: error,
      })
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      alert(`입고 처리 중 오류가 발생했습니다.\n오류: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const exportTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ItemName,Specification,Maker,UnitPrice,Purpose,Quantity,Condition,Reason,OrderedBy,ReceivedBy,ReceivedDate\n" +
      "Sample Item,Sample Spec,Sample Maker,10000,Sample Purpose,10,신품,Sample Reason,Sample Orderer,Sample Receiver," + new Date().toISOString().split('T')[0]
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "stock_in_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {return}

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      // 업로드된 파일 처리
      
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('파일 형식이 올바르지 않습니다. 헤더와 최소 하나의 데이터 행이 필요합니다.')
        return
      }

      const _headers = (lines[0] || '').split(',').map(h => h.trim())
      // 헤더 파싱 완료
      
      const dataRows = lines.slice(1).filter(line => line.trim())
      // 데이터 행 추출 완료

      const newRows: BulkStockInRow[] = dataRows.map((line, index) => {
        const values = line.split(',').map(v => v.trim())
        // 행 데이터 파싱
        
        // 날짜 검증 함수
        const isValidDate = (dateStr: string) => {
          if (!dateStr) {return false}
          const date = new Date(dateStr)
          return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
        }
        
        // 기본 날짜 설정
        let receivedDate = values[9] || new Date().toISOString().split('T')[0] || ''
        if (!isValidDate(receivedDate)) {
          console.warn(`행 ${index + 1}: 잘못된 날짜 형식 "${receivedDate}", 오늘 날짜로 설정`)
          receivedDate = new Date().toISOString().split('T')[0] || ''
        }
        
        const row = {
          name: values[0] || '',
          specification: values[1] || '',
          maker: values[2] || '',
          unit_price: parseFloat(values[3] || '0') || 0,
          purpose: values[4] || '',
          quantity: parseInt(values[5] || '0') || 0,
          condition_type: mapConditionType(values[6] || '') || 'new',
          reason: values[7] || '',
          ordered_by: values[8] || '',
          received_by: values[9] || '',
          received_date: receivedDate
        }
        
        // 행 파싱 완료
        return row
      })

      // CSV 파싱 완료

      if (newRows.length > 0) {
        // 기존 행을 유지하면서 새 행 추가
        setRows(prevRows => {
          // 기존에 빈 행이 하나만 있고 모든 필드가 비어있으면 새 행으로 교체
          if (prevRows.length === 1 && 
              prevRows[0]?.name === '' && 
              prevRows[0]?.specification === '' && 
              (prevRows[0]?.quantity || 0) === 0) {
            return newRows
          }
          // 그렇지 않으면 기존 행에 새 행 추가
          return [...prevRows, ...newRows]
        })
        alert(`${newRows.length}개의 항목이 업로드되었습니다.`)
      } else {
        alert('유효한 데이터가 없습니다. 파일 형식을 확인해주세요.')
      }
    }
    
    reader.onerror = () => {
      alert('파일을 읽는 중 오류가 발생했습니다.')
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  const mapConditionType = (value: string): 'new' | 'used_good' | 'used_defective' | 'unknown' => {
    if (value === '신품') {return 'new'}
    if (value === '중고(양품)') {return 'used_good'}
    if (value === '중고(불량)') {return 'used_defective'}
    if (value === '모름') {return 'unknown'}
    return 'new' // 기본값
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>재고 신고 입력 (대량)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 도구 버튼 */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={exportTemplate}>
                <Download className="h-4 w-4 mr-2" />
                템플릿 다운로드
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    엑셀 업로드
                  </label>
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {/* 엑셀 스타일 도구 */}
              <Button type="button" variant="outline" size="sm" onClick={selectAllRows}>
                <CheckSquare className="h-4 w-4 mr-1" />
                전체선택
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                <Square className="h-4 w-4 mr-1" />
                선택해제
              </Button>
              {selectedRows.size > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={deleteSelectedRows} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  선택삭제 ({selectedRows.size})
                </Button>
              )}
            </div>
            
            <Button type="button" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              행 추가
            </Button>
          </div>

          {/* 엑셀 스타일 테이블 */}
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50">
                    선택
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50">
                    #
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    품명 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    규격 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    메이커 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    용도
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    입고수량 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    상태 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    입고사유
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    발주자
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    입고자 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    입고일 *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row, index) => {
                   const rowErrors = getRowErrors(index)
                   const hasRowErrors = Object.keys(rowErrors).length > 0
                   
                   return (
                     <tr key={index} className={`hover:bg-blue-50 transition-colors ${selectedRows.has(index) ? 'bg-blue-100' : ''} ${hasRowErrors ? 'bg-red-50' : ''}`}>
                       <td className="border border-gray-300 px-3 py-2 text-center">
                         <input
                           type="checkbox"
                           checked={selectedRows.has(index)}
                           onChange={() => toggleRowSelection(index)}
                           className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                         />
                       </td>
                       <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                         {index + 1}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.name}
                           onChange={(e) => updateRow(index, 'name', e.target.value)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${getErrorStyle('name', index)}`}
                           placeholder="품명"
                         />
                         {rowErrors.name && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.name}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.specification}
                           onChange={(e) => updateRow(index, 'specification', e.target.value)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorStyle('specification', index)}`}
                           placeholder="규격"
                         />
                         {rowErrors.specification && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.specification}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.maker}
                           onChange={(e) => updateRow(index, 'maker', e.target.value)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${getErrorStyle('maker', index)}`}
                           placeholder="메이커"
                         />
                         {rowErrors.maker && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.maker}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="number"
                           value={row.unit_price}
                           onChange={(e) => updateRow(index, 'unit_price', parseFloat(e.target.value) || 0)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right ${getErrorStyle('unit_price', index)}`}
                           placeholder="금액"
                           min="0"
                           step="0.01"
                         />
                         {rowErrors.unit_price && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.unit_price}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.purpose}
                           onChange={(e) => updateRow(index, 'purpose', e.target.value)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${getErrorStyle('purpose', index)}`}
                           placeholder="용도"
                         />
                         {rowErrors.purpose && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.purpose}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="number"
                           value={row.quantity}
                           onChange={(e) => updateRow(index, 'quantity', parseInt(e.target.value) || 0)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-black ${getErrorStyle('quantity', index)}`}
                           placeholder="수량"
                           min="1"
                         />
                         {rowErrors.quantity && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.quantity}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <select
                           value={row.condition_type}
                           onChange={(e) => updateRow(index, 'condition_type', e.target.value)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${getErrorStyle('condition_type', index)}`}
                         >
                           <option value="new">신품</option>
                           <option value="used_good">중고(양품)</option>
                           <option value="used_defective">중고(불량)</option>
                           <option value="unknown">모름</option>
                         </select>
                         {rowErrors.condition_type && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.condition_type}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.reason}
                           onChange={(e) => updateRow(index, 'reason', e.target.value)}
                           className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                           placeholder="입고사유"
                         />
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.ordered_by}
                           onChange={(e) => updateRow(index, 'ordered_by', e.target.value)}
                           className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                           placeholder="발주자"
                         />
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <input
                           type="text"
                           value={row.received_by}
                           onChange={(e) => updateRow(index, 'received_by', e.target.value)}
                           className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorStyle('received_by', index)}`}
                           placeholder="입고자"
                         />
                         {rowErrors.received_by && (
                           <p className="text-red-500 text-xs mt-1">{rowErrors.received_by}</p>
                         )}
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <div className="relative">
                           <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                           <input
                             type="date"
                             value={row.received_date}
                             onChange={(e) => updateRow(index, 'received_date', e.target.value)}
                             className={`w-full pl-7 pr-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorStyle('received_date', index)}`}
                           />
                           {rowErrors.received_date && (
                             <p className="text-red-500 text-xs mt-1">{rowErrors.received_date}</p>
                           )}
                         </div>
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <div className="flex space-x-1">
                           <button
                             type="button"
                             onClick={() => duplicateRow(index)}
                             className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                             title="행 복사"
                           >
                             <Copy className="h-3 w-3" />
                           </button>
                           <button
                             type="button"
                             onClick={() => moveRow(index, 'up')}
                             disabled={index === 0}
                             className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                             title="위로 이동"
                           >
                             <ArrowUp className="h-3 w-3" />
                           </button>
                           <button
                             type="button"
                             onClick={() => moveRow(index, 'down')}
                             disabled={index === rows.length - 1}
                             className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                             title="아래로 이동"
                           >
                             <ArrowDown className="h-3 w-3" />
                           </button>
                           <button
                             type="button"
                             onClick={() => removeRow(index)}
                             className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                             disabled={rows.length === 1}
                             title="행 삭제"
                           >
                             <Trash2 className="h-3 w-3" />
                           </button>
                         </div>
                       </td>
                     </tr>
                   )
                 })}
              </tbody>
            </table>
          </div>

          {/* 사용법 안내 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">사용법</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>템플릿 다운로드</strong>: CSV 템플릿을 다운로드하여 엑셀에서 편집</li>
              <li>• <strong>엑셀 업로드</strong>: 편집한 CSV 파일을 업로드하여 자동으로 데이터 입력</li>
              <li>• <strong>행 추가</strong>: 수동으로 행을 추가하여 직접 입력</li>
              <li>• <strong>상태</strong>: 신품, 중고(양품), 중고(불량), 모름</li>
            </ul>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={loading || hasErrors()}
              className={hasErrors() ? 'bg-gray-400 cursor-not-allowed' : ''}
            >
              {loading ? '저장 중...' : hasErrors() ? '오류 수정 필요' : '대량 입고 등록'}
            </Button>
          </div>
          
          {/* 오류 상태 표시 */}
          {hasErrors() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">
                ⚠️ 빨간색으로 표시된 필드들을 올바르게 입력해주세요.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 