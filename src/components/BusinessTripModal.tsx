'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  X, 
  Save, 
  Send,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface BusinessTripModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  trip?: any
  projects?: any[]
  users?: any[]
  mode: 'create' | 'edit' | 'view'
}

export default function BusinessTripModal({
  isOpen,
  onClose,
  onSave,
  trip,
  projects = [],
  users = [],
  mode = 'create'
}: BusinessTripModalProps) {
  const [formData, setFormData] = useState({
    trip_type: 'business_trip',
    sub_type: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    purpose: '',
    project_id: '',
    companions: [] as string[]
  })

  const [errors, setErrors] = useState<{
    title?: string
    start_date?: string
    end_date?: string
    location?: string
    purpose?: string
    sub_type?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 초기 데이터 설정
  useEffect(() => {
    if (trip && mode !== 'create') {
      setFormData({
        trip_type: trip.trip_type || 'business_trip',
        sub_type: trip.sub_type || '',
        title: trip.title || '',
        description: trip.description || '',
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        start_time: trip.start_time || '',
        end_time: trip.end_time || '',
        location: trip.location || '',
        purpose: trip.purpose || '',
        project_id: trip.project_id || '',
        companions: trip.companions || []
      })
    } else if (mode === 'create') {
      // 새 신청 시 기본값 설정
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      setFormData({
        trip_type: 'business_trip',
        sub_type: '',
        title: '',
        description: '',
        start_date: today.toISOString().split('T')[0] || '',
        end_date: tomorrow.toISOString().split('T')[0] || '',
        start_time: '09:00',
        end_time: '18:00',
        location: '',
        purpose: '',
        project_id: '',
        companions: []
      })
    }
  }, [trip, mode])

  // 유효성 검사
  const validateForm = () => {
    const newErrors: {
      title?: string
      start_date?: string
      end_date?: string
      location?: string
      purpose?: string
      sub_type?: string
    } = {}

    if (!formData.title.trim()) {
      newErrors.title = '제목은 필수입니다.'
    }

    if (!formData.start_date) {
      newErrors.start_date = '시작일은 필수입니다.'
    }

    if (!formData.end_date) {
      newErrors.end_date = '종료일은 필수입니다.'
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = '종료일은 시작일보다 늦어야 합니다.'
    }

    if (!formData.location.trim()) {
      newErrors.location = '장소는 필수입니다.'
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = '목적은 필수입니다.'
    }

    if (formData.trip_type === 'business_trip' && !formData.sub_type) {
      newErrors.sub_type = '출장 세부구분은 필수입니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 동행자 토글
  const toggleCompanion = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      companions: prev.companions.includes(userId)
        ? prev.companions.filter(id => id !== userId)
        : [...prev.companions, userId]
    }))
  }

  // 출장 세부구분 옵션
  const getSubTypeOptions = (tripType: string) => {
    if (tripType === 'business_trip') {
      return [
        { value: '시운전', label: '시운전' },
        { value: '현장답사', label: '현장답사' },
        { value: '보완작업', label: '보완작업' },
        { value: 'AS', label: 'AS' },
        { value: 'SS', label: 'SS' }
      ]
    } else {
      return [
        { value: '현장점검', label: '현장점검' },
        { value: '고객방문', label: '고객방문' },
        { value: '교육', label: '교육' },
        { value: '기타', label: '기타' }
      ]
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {mode === 'create' ? '출장/외근 신청' : 
               mode === 'edit' ? '출장/외근 수정' : '출장/외근 상세'}
            </CardTitle>
            <CardDescription>
              {mode === 'create' ? '새로운 출장 또는 외근을 신청하세요' :
               mode === 'edit' ? '출장/외근 정보를 수정하세요' : '출장/외근 상세 정보를 확인하세요'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trip_type">구분 *</Label>
                <Select
                  value={formData.trip_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trip_type: value, sub_type: '' }))}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="구분 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_trip">출장</SelectItem>
                    <SelectItem value="field_work">외근</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sub_type">세부구분 *</Label>
                <Select
                  value={formData.sub_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sub_type: value }))}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="세부구분 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubTypeOptions(formData.trip_type).map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sub_type && <p className="text-red-500 text-sm mt-1">{errors.sub_type}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="출장/외근 제목을 입력하세요"
                className="mt-1"
                disabled={mode === 'view'}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">상세 내용</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="출장/외근 상세 내용을 입력하세요"
                className="mt-1 min-h-[100px]"
                disabled={mode === 'view'}
              />
            </div>

            {/* 날짜 및 시간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">시작일 *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="mt-1"
                  disabled={mode === 'view'}
                />
                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <Label htmlFor="end_date">종료일 *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="mt-1"
                  disabled={mode === 'view'}
                />
                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">시작 시간</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                  disabled={mode === 'view'}
                />
              </div>

              <div>
                <Label htmlFor="end_time">종료 시간</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1"
                  disabled={mode === 'view'}
                />
              </div>
            </div>

            {/* 장소 및 목적 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">장소 *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="출장/외근 장소를 입력하세요"
                  className="mt-1"
                  disabled={mode === 'view'}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <Label htmlFor="purpose">목적 *</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="출장/외근 목적을 입력하세요"
                  className="mt-1"
                  disabled={mode === 'view'}
                />
                {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
              </div>
            </div>

            {/* 프로젝트 선택 */}
            <div>
              <Label htmlFor="project">관련 프로젝트</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="관련 프로젝트 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.project_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 동행자 선택 */}
            <div>
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                동행자 선택
              </Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.companions.includes(user.id)}
                      onChange={() => toggleCompanion(user.id)}
                      className="rounded"
                      disabled={mode === 'view'}
                    />
                    <span className="text-sm">{user.first_name} {user.last_name}</span>
                  </label>
                ))}
              </div>
              {formData.companions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.companions.map(companionId => {
                    const companion = users.find(u => u.id === companionId)
                    return companion ? (
                      <Badge key={companionId} variant="secondary">
                        {companion.first_name} {companion.last_name}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            {mode !== 'view' && (
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {mode === 'create' ? '신청하기' : '수정하기'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
