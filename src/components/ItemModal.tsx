'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabaseClient'
import type { Item } from '@/lib/types'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  item?: Item
  onSave: (item: Item) => void
}

export default function ItemModal({ isOpen, onClose, item, onSave }: ItemModalProps) {
  const [formData, setFormData] = useState({
    product: item?.product || '',
    spec: item?.spec || '',
    maker: item?.maker || '',
    unit_price: item?.unit_price || 0,
    purpose: item?.purpose || '',
    min_stock: item?.min_stock || 0,
    category: item?.category || '',
    note: item?.note || ''
  })
  const [loading, setLoading] = useState(false)

  // useEffect(() => {
  //   if (item) {
  //     setFormData({
  //             product: item.product,
  //     spec: item.spec,
  //       maker: item.maker,
  //       unit_price: item.unit_price,
  //       purpose: item.purpose,
  //       min_stock: item.min_stock,
  //       category: item.category || '',
  //       description: item.description || ''
  //     })
  //   } else {
  //     setFormData({
  //       name: '',
  //       specification: '',
  //       maker: '',
  //       unit_price: 0,
  //       purpose: '',
  //       min_stock: 0,
  //       category: '',
  //       description: ''
  //     })
  //   }
  // }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (item) {
        // 기존 품목 수정
        const { error } = await (supabase as any)
          .from('items')
          .update({
            product: formData.product,
            spec: formData.spec,
            maker: formData.maker,
            unit_price: formData.unit_price,
            purpose: formData.purpose,
            min_stock: formData.min_stock,
            category: formData.category,
            note: formData.note
          })
          .eq('id', item.id)

        if (error) throw error
        onSave({ ...item, ...formData })
      } else {
        // 새 품목 추가
        const { data, error } = await (supabase as any)
          .from('items')
          .insert([{
            product: formData.product,
            spec: formData.spec,
            maker: formData.maker,
            unit_price: formData.unit_price,
            purpose: formData.purpose,
            min_stock: formData.min_stock,
            category: formData.category,
            note: formData.note
          }])
          .select()
          .single()

        if (error) throw error
        onSave(data)
      }
      onClose()
    } catch (error) {
      console.error('품목 저장 오류:', error)
      alert('품목 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? '품목 수정' : '새 품목 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              품명 *
            </label>
            <input
              type="text"
              required
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                규격 *
              </label>
              <input
                type="text"
                required
                value={formData.spec}
                onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메이커
              </label>
              <input
                type="text"
                value={formData.maker}
                onChange={(e) => setFormData({ ...formData, maker: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단가 *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최소 재고 *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              용도
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비고
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="추가 설명을 입력하세요"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : (item ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 