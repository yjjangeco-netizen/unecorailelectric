'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface LeaveRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  selectedDate?: Date | null
  event?: any // 편집 모드
}

export default function LeaveRequestModal({ isOpen, onClose, onSave, selectedDate, event }: LeaveRequestModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    leaveType: 'annual' as 'annual' | 'half_day' | 'sick' | 'personal',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    totalDays: 1,
    reason: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    if (!event) return
    
    if (!confirm('이 연차/반차 신청을 삭제하시겠습니까?')) {
      return
    }

    setIsSubmitting(true)
    try {
      const leaveId = event.id.replace('leave-', '')
      const response = await fetch(`/api/leave-requests?id=${leaveId}`, {
        method: 'DELETE',
        headers: {
          'x-user-level': user?.level?.toString() || '1',
          'x-user-id': user?.id || ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete leave request')
      }

      alert('연차/반차 신청이 삭제되었습니다')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error deleting leave request:', error)
      alert('연차/반차 삭제 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (event && event.extendedProps?.type === 'leave') {
        // 편집 모드
        const startDate = typeof event.start === 'string' ? event.start.split('T')[0] : event.start.toISOString().split('T')[0]
        const endDate = event.end ? (typeof event.end === 'string' ? event.end.split('T')[0] : event.end.toISOString().split('T')[0]) : startDate
        
        setFormData({
          leaveType: event.extendedProps?.leaveType || 'annual',
          startDate: startDate,
          endDate: endDate,
          startTime: event.extendedProps?.startTime || '',
          endTime: event.extendedProps?.endTime || '',
          totalDays: event.extendedProps?.totalDays || 1,
          reason: event.extendedProps?.reason || ''
        })
      } else {
        // 생성 모드
        const targetDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        setFormData({
          leaveType: 'annual',
          startDate: targetDate,
          endDate: targetDate,
          startTime: '',
          endTime: '',
          totalDays: 1,
          reason: ''
        })
      }
    }
  }, [isOpen, selectedDate, event])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // 반차인 경우 시간 필수
      if (field === 'leaveType' && value === 'half_day') {
        updated.startTime = '09:00'
        updated.endTime = '13:00'
        updated.totalDays = 0.5
      } else if (field === 'leaveType' && value !== 'half_day') {
        updated.startTime = ''
        updated.endTime = ''
      }
      
      // 날짜 변경 시 총 일수 자동 계산
      if (field === 'startDate' || field === 'endDate') {
        if (updated.startDate && updated.endDate) {
          const start = new Date(updated.startDate)
          const end = new Date(updated.endDate)
          const diffTime = Math.abs(end.getTime() - start.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
          updated.totalDays = updated.leaveType === 'half_day' ? 0.5 : diffDays
        }
      }
      
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('시작일과 종료일은 필수입니다.')
      return
    }

    if (formData.leaveType === 'half_day' && (!formData.startTime || !formData.endTime)) {
      alert('반차는 시작 시간과 종료 시간이 필수입니다.')
      return
    }

    if (!formData.reason.trim()) {
      alert('사유를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        user_id: user?.id,
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: formData.startTime || null,
        end_time: formData.endTime || null,
        total_days: formData.totalDays,
        reason: formData.reason,
        status: 'pending'
      }

      const isEditMode = event && event.id.startsWith('leave-')
      const url = isEditMode ? `/api/leave-requests?id=${event.id.replace('leave-', '')}` : '/api/leave-requests'
      const method = isEditMode ? 'PUT' : 'POST'

      console.log('연차/반차 요청:', { method, url, payload })

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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save leave request')
      }

      alert(isEditMode ? '연차/반차가 수정되었습니다.' : '연차/반차 신청이 완료되었습니다.')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving leave request:', error)
      alert(`연차/반차 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            {event ? '연차/반차 수정' : '연차/반차 신청'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-6">
          {/* 휴가 구분 */}
          <div className="space-y-2">
            <Label htmlFor="leaveType" className="text-sm font-semibold text-gray-700">
              휴가 구분 <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.leaveType} 
              onValueChange={(value) => handleChange('leaveType', value)}
            >
              <SelectTrigger className="w-full h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="휴가 구분 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="annual" className="hover:bg-blue-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>연차 (하루)</span>
                  </div>
                </SelectItem>
                <SelectItem value="half_day" className="hover:bg-blue-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏰</span>
                    <span>반차 (오전/오후)</span>
                  </div>
                </SelectItem>
                <SelectItem value="sick" className="hover:bg-blue-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏥</span>
                    <span>병가</span>
                  </div>
                </SelectItem>
                <SelectItem value="personal" className="hover:bg-blue-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <span>개인 휴가</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                시작일 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                종료일 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 반차인 경우 시간 선택 */}
          {formData.leaveType === 'half_day' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  시작 시간 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  종료 시간 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 총 일수 표시 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">총 휴가 일수</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-blue-600">{formData.totalDays}</span>
                <span className="text-lg font-semibold text-blue-600">일</span>
              </div>
            </div>
          </div>

          {/* 사유 */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold text-gray-700">
              휴가 사유 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              className="min-h-[120px] border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
              placeholder="휴가 사유를 자세히 입력해주세요..."
            />
          </div>

          {/* 안내 메시지 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 rounded-full p-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900 mb-2 text-sm">📋 신청 안내사항</p>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>연차:</strong> 하루 전체 휴가 (09:00~18:00)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>반차:</strong> 오전 또는 오후 반나절 휴가</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>신청 후 <strong>팀장(Level 5)</strong> 승인이 필요합니다</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex justify-between">
          <div>
            {event && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="h-12 px-6 text-base font-semibold bg-red-600 hover:bg-red-700"
              >
                삭제
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 px-6 text-base font-semibold border-2"
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-12 px-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? (event ? '수정 중...' : '신청 중...') : (event ? '✅ 수정하기' : '✅ 신청하기')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

