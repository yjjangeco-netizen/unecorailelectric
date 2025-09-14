'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Calendar, Clock, MapPin, Users } from 'lucide-react'

interface CalendarEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: any) => void
  selectedDate?: string
  event?: any
  users?: any[]
}

export default function CalendarEventModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  event,
  users = []
}: CalendarEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    start_date: selectedDate || '',
    end_date: selectedDate || '',
    start_time: '',
    end_time: '',
    category: '기타',
    sub_category: '',
    description: '',
    location: '',
    participant_id: '',
    companions: [] as string[]
  })

  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([])

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        start_date: event.start_date || selectedDate || '',
        end_date: event.end_date || event.start_date || selectedDate || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        category: event.category || '기타',
        sub_category: event.sub_category || '',
        description: event.description || '',
        location: event.location || '',
        participant_id: event.participant_id || '',
        companions: event.companions || []
      })
      setSelectedCompanions(event.companions || [])
    } else {
      setFormData({
        title: '',
        start_date: selectedDate || '',
        end_date: selectedDate || '',
        start_time: '',
        end_time: '',
        category: '기타',
        sub_category: '',
        description: '',
        location: '',
        participant_id: '',
        companions: []
      })
      setSelectedCompanions([])
    }
  }, [event, selectedDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const eventData = {
      ...formData,
      companions: selectedCompanions
    }
    
    onSave(eventData)
  }

  const handleCompanionToggle = (userId: string) => {
    setSelectedCompanions(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {event ? '일정 수정' : '새 일정 추가'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 제목 */}
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="일정 제목을 입력하세요"
                required
              />
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">시작일 *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">종료일</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">시작 시간</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_time">종료 시간</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            {/* 카테고리 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="출장/외근">출장/외근</SelectItem>
                    <SelectItem value="반차/연차">반차/연차</SelectItem>
                    <SelectItem value="회의">회의</SelectItem>
                    <SelectItem value="교육">교육</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sub_category">세부 카테고리</Label>
                <Input
                  id="sub_category"
                  value={formData.sub_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, sub_category: e.target.value }))}
                  placeholder="세부 카테고리"
                />
              </div>
            </div>

            {/* 장소 */}
            <div>
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                장소
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="장소를 입력하세요"
              />
            </div>

            {/* 설명 */}
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="일정에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>

            {/* 참석자 */}
            <div>
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                동행자 선택
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCompanions.includes(user.id)}
                      onChange={() => handleCompanionToggle(user.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit">
                {event ? '수정' : '추가'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
