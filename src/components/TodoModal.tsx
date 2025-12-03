'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, AlertCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface TodoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  todo?: any // If provided, we are in edit mode
}

export default function TodoModal({ isOpen, onClose, onSave, todo }: TodoModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (todo) {
        // Edit mode: populate form
        setFormData({
          title: todo.title || '',
          dueDate: todo.due_date || '',
          priority: todo.priority || 'medium',
          category: todo.category || ''
        })
      } else {
        // Create mode: reset form
        setFormData({
          title: '',
          dueDate: '',
          priority: 'medium',
          category: ''
        })
      }
    }
  }, [isOpen, todo])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const url = todo ? `/api/todos/${todo.id}` : '/api/todos'
      const method = todo ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save todo')
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving todo:', error)
      alert('할일 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white">
        <DialogHeader>
          <DialogTitle>{todo ? '할일 수정' : '새 할일 추가'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="col-span-3"
              placeholder="할일 제목 입력"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              마감일
            </Label>
            <div className="col-span-3 relative">
              <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              우선순위
            </Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => handleChange('priority', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="우선순위 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="low">낮음</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="high">긴급</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              카테고리
            </Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="col-span-3"
              placeholder="카테고리 입력 (선택)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

