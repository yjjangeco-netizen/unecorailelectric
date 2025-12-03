'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Clock, MapPin, Trash2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  event?: any // If provided, we are in edit mode
  selectedDate?: Date | null // For creating event on specific date
}

export default function EventModal({ isOpen, onClose, onSave, event, selectedDate }: EventModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    category: '업무',
    summary: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    location: '',
    description: '',
    participantId: '',
    participantName: ''
  })
  
  const [projectSearch, setProjectSearch] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [showProjectList, setShowProjectList] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode: populate form
        // event.start가 Date 객체이거나 문자열일 수 있음
        const startStr = typeof event.start === 'string' ? event.start : event.start.toISOString()
        const endStr = event.end ? (typeof event.end === 'string' ? event.end : event.end.toISOString()) : startStr
        
        setFormData({
          category: event.extendedProps?.category || '업무',
          summary: event.title.replace(/^\[.*?\]\s*/, ''), // Remove [Category] prefix
          startDate: startStr.split('T')[0],
          startTime: startStr.split('T')[1]?.substring(0, 5) || '',
          endDate: endStr.split('T')[0],
          endTime: endStr.split('T')[1]?.substring(0, 5) || '',
          location: event.extendedProps?.location || '',
          description: event.extendedProps?.description || '',
          participantId: event.extendedProps?.participantId || user?.id || '',
          participantName: event.extendedProps?.participant || user?.name || ''
        })
      } else {
        // Create mode: reset form
        const targetDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        setFormData({
          category: '업무',
          summary: '',
          startDate: targetDate,
          startTime: '09:00',
          endDate: targetDate,
          endTime: '18:00',
          location: '',
          description: '',
          participantId: user?.id || '',
          participantName: user?.name || ''
        })
      }
    }
  }, [isOpen, event, user, selectedDate])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.summary || !formData.startDate) {
      alert('제목과 시작일은 필수입니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const url = event ? `/api/events/${event.id.replace('event-', '')}` : '/api/events'
      const method = event ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        participantId: user?.id, // Ensure current user is the participant/creator for now
        participantName: user?.name,
        participantLevel: user?.level
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-level': String(user?.level || '1')
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save event')
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('일정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !confirm('정말로 이 일정을 삭제하시겠습니까?')) return

    setIsSubmitting(true)
    try {
      const eventId = event.id.replace('event-', '')
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
          'x-user-level': String(user?.level || '1')
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete event')
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      alert(error.message || '일정 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>{event ? '일정 수정' : '새 일정 등록'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              구분
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="구분 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="업무">업무</SelectItem>
                <SelectItem value="개인">개인</SelectItem>
                <SelectItem value="회의">회의</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="summary" className="text-right">
              제목
            </Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              className="col-span-3"
              placeholder="일정 제목 입력"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">시작</Label>
            <div className="col-span-3 flex gap-2">
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative w-1/3">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">종료</Label>
            <div className="col-span-3 flex gap-2">
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative w-1/3">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              장소
            </Label>
            <div className="col-span-3 relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="pl-9"
                placeholder="장소 입력 (선택)"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              내용
            </Label>
            <div className="col-span-3">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="min-h-[100px]"
                placeholder="상세 내용 입력 (선택)"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {event ? (
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          ) : (
            <div></div> // Spacer
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
