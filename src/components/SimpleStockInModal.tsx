'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SimpleStockItem } from '@/lib/types'

interface SimpleStockInModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function SimpleStockInModal({ isOpen, onClose, onSave }: SimpleStockInModalProps) {
  const [formData, setFormData] = useState<Omit<SimpleStockItem, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    specification: '',
    maker: '',
    location: '',
    remark: '',
    status: 'active',
    in_data: 0,
    unit_price: 0
  })
  const [isSaving, setIsSaving] = useState(false)

  // 간단한 입고 처리
  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // 1. Stock_In 테이블에 입고 기록
      const { error: stockInError } = await supabase
        .from('Stock_In')
        .insert({
          Name: formData.name,
          Spec: formData.specification,
          Maker: formData.maker,
          Location: formData.location,
          Remark: formData.remark,
          Status: formData.status,
          In_data: formData.in_data,
          Plus_data: formData.in_data, // 입고량과 동일
          Total_qunty: formData.in_data, // 입고량과 동일
          Unit_price: formData.unit_price
        })

      if (stockInError) {
        throw new Error(`입고 기록 실패: ${stockInError.message}`)
      }

      // 2. items 테이블에 추가 또는 업데이트
      const { error: currentStockError } = await supabase
        .from('items')
        .upsert({
          Name: formData.name,
          Spec: formData.specification,
          Maker: formData.maker,
          Location: formData.location,
          Remark: formData.remark,
          Status: formData.status,
          In_data: formData.in_data,
          Plus_data: formData.in_data,
          Total_qunty: formData.in_data,
          Unit_price: formData.unit_price
        }, {
          onConflict: 'Name,Spec', // Name + Spec으로 중복 처리
          ignoreDuplicates: false
        })

      if (currentStockError) {
        throw new Error(`현재 재고 업데이트 실패: ${currentStockError.message}`)
      }

      alert('입고가 성공적으로 처리되었습니다!')
      onSave()
      onClose()

    } catch (error) {
      console.error('입고 처리 오류:', error)
      alert(`입고 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 폼 초기화
  const handleClose = () => {
    setFormData({
      name: '',
      specification: '',
      maker: '',
      location: '',
      remark: '',
      status: 'active',
      in_data: 0,
      unit_price: 0
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <span className="text-black">간단한 재고 입고</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleStockIn} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                품목명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="품목명을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                규격
              </label>
              <input
                type="text"
                value={formData.specification}
                onChange={(e) => setFormData({...formData, specification: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="규격을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                제조사
              </label>
              <input
                type="text"
                value={formData.maker}
                onChange={(e) => setFormData({...formData, maker: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="제조사를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                위치
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="창고 위치를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.in_data}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  // 최대값 제한 (INTEGER 범위: 2,147,483,647)
                  if (value > 2147483647) {
                    alert('수량은 2,147,483,647개를 초과할 수 없습니다.')
                    return
                  }
                  setFormData({...formData, in_data: value})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="0"
                min="1"
                max="2147483647"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 수량: 2,147,483,647개
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                단가
              </label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  // 최대값 제한 (DECIMAL(15,2) 범위: 999,999,999,999.99)
                  if (value > 999999999999.99) {
                    alert('단가는 999,999,999,999.99원을 초과할 수 없습니다.')
                    return
                  }
                  setFormData({...formData, unit_price: value})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                placeholder="0"
                min="0"
                max="999999999999.99"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 단가: 999,999,999,999.99원
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              비고
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({...formData, remark: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
              rows={3}
              placeholder="추가 메모를 입력하세요"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSaving ? '처리 중...' : '입고 처리'}
            </Button>
            <Button 
              type="button" 
              onClick={handleClose} 
              variant="outline" 
              className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
