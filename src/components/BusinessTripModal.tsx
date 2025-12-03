'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Clock, MapPin, Search } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { format, parseISO } from 'date-fns'

interface BusinessTripModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  selectedDate?: Date | null
  event?: any // 편집 모드
}

export default function BusinessTripModal({ isOpen, onClose, onSave, selectedDate, event }: BusinessTripModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    tripType: 'field_work', // 'field_work' 또는 'business_trip'
    category: 'project', // 'project', 'as_ss', 'etc'
    subType: '', // category에 따라 다름
    projectId: '',
    projectName: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    location: '',
    purpose: ''
  })
  
  const [projectSearch, setProjectSearch] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [showProjectList, setShowProjectList] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      
      if (event && event.extendedProps?.type === 'business_trip') {
        // 편집 모드
        const startDate = typeof event.start === 'string' ? parseISO(event.start) : event.start
        const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : startDate
        
        setFormData({
          tripType: event.extendedProps?.tripType || 'field_work',
          category: event.extendedProps?.category || 'project',
          subType: event.extendedProps?.subType || '',
          projectId: event.extendedProps?.projectId || '',
          projectName: event.extendedProps?.projectName || '',
          startDate: format(startDate, 'yyyy-MM-dd'),
          startTime: format(startDate, 'HH:mm'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          endTime: format(endDate, 'HH:mm'),
          location: event.extendedProps?.location || '',
          purpose: event.extendedProps?.description || ''
        })
        setProjectSearch(event.extendedProps?.projectName || '')
      } else {
        // 생성 모드
        const targetDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        setFormData({
          tripType: 'field_work',
          category: 'project',
          subType: '',
          projectId: '',
          projectName: '',
          startDate: targetDate,
          startTime: '09:00',
          endDate: targetDate,
          endTime: '18:00',
          location: '',
          purpose: ''
        })
        setProjectSearch('')
      }
    }
  }, [isOpen, selectedDate, event])
  
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        // API가 배열을 직접 반환하거나 { projects: [] } 형태일 수 있음
        const projectList = Array.isArray(data) ? data : (data.projects || [])
        console.log('프로젝트 로드됨:', projectList.length)
        setProjects(projectList)
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
    }
  }
  
  // 프로젝트 검색 필터링 (name 또는 project_name 모두 지원)
  const filteredProjects = projectSearch.trim() 
    ? projects.filter(project => {
        const searchLower = projectSearch.toLowerCase()
        const projectName = (project.name || project.project_name || '').toLowerCase()
        const projectNumber = (project.project_number || '').toLowerCase()
        return projectName.includes(searchLower) || projectNumber.includes(searchLower)
      }).slice(0, 10) // 검색 시 상위 10개
    : projects.slice(0, 20) // 전체 보기 시 상위 20개

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // category가 변경되면 subType 초기화
      if (field === 'category') {
        updated.subType = ''
      }
      
      return updated
    })
  }
  
  // category에 따른 세부유형 옵션
  const getSubTypeOptions = () => {
    switch (formData.category) {
      case 'project':
        return [
          { value: 'none', label: '선택안함' },
          { value: '현장답사', label: '현장답사' },
          { value: '공장시운전', label: '공장시운전' },
          { value: '현장시운전', label: '현장시운전' },
          { value: '운용자교육', label: '운용자교육' },
          { value: '보완작업', label: '보완작업' },
          { value: '기타', label: '기타' }
        ]
      case 'as_ss':
        return [
          { value: 'none', label: '선택안함' },
          { value: 'AS', label: 'AS' },
          { value: 'SS', label: 'SS' }
        ]
      default:
        return []
    }
  }
  
  const handleProjectSelect = (project: any) => {
    const displayName = project.name || project.project_name || project.project_number || ''
    setFormData(prev => ({
      ...prev,
      projectId: project.id,
      projectName: displayName
    }))
    setProjectSearch(displayName)
    setShowProjectList(false)
  }

  const handleDelete = async () => {
    if (!event) return
    
    if (!confirm('이 일정을 삭제하시겠습니까?')) {
      return
    }

    setIsSubmitting(true)
    try {
      let apiUrl = ''
      let eventId = ''
      
      // ID 형식에 따라 API 엔드포인트 결정
      if (event.id.startsWith('trip-')) {
        eventId = event.id.replace('trip-', '')
        apiUrl = `/api/business-trips?id=${eventId}`
      } else if (event.id.startsWith('event-')) {
        eventId = event.id.replace('event-', '')
        apiUrl = `/api/events?id=${eventId}`
      } else {
        throw new Error('알 수 없는 일정 형식입니다')
      }
      
      console.log('삭제 요청:', { eventId, apiUrl, userId: user?.id, userLevel: user?.level })
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'x-user-level': user?.level?.toString() || '1',
          'x-user-id': user?.id || ''
        }
      })

      const data = await response.json()
      console.log('삭제 응답:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event')
      }

      alert('일정이 삭제되었습니다')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert(`일정 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.location.trim()) {
      alert('장소를 입력해주세요')
      return
    }
    
    if (!formData.purpose.trim()) {
      alert('내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        user_id: user?.id,
        user_name: user?.name,
        trip_type: formData.tripType,
        category: formData.category,
        sub_type: formData.subType || null,
        project_id: formData.projectId || null,
        title: formData.location, // 장소를 제목으로 사용
        location: formData.location,
        purpose: formData.purpose,
        start_date: formData.startDate,
        start_time: formData.startTime || null,
        end_date: formData.endDate,
        end_time: formData.endTime || null,
        status: 'approved' // 자동 승인
      }

      let url = '/api/business-trips'
      let method = 'POST'
      
      if (event) {
        // 편집 모드
        if (event.id.startsWith('trip-')) {
          url = `/api/business-trips?id=${event.id.replace('trip-', '')}`
          method = 'PUT'
        } else if (event.id.startsWith('event-')) {
          url = `/api/events?id=${event.id.replace('event-', '')}`
          method = 'PUT'
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-level': user?.level?.toString() || '1',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save trip')
      }

      alert(event ? '일정이 수정되었습니다' : '일정이 등록되었습니다')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving trip:', error)
      alert(`일정 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {event ? '일정 수정' : '일정 등록'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          {/* 선택 (외근/출장) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tripType" className="text-right font-semibold">
              선택 <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.tripType} onValueChange={(value) => handleChange('tripType', value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="외근/출장 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="field_work">외근</SelectItem>
                <SelectItem value="business_trip">출장</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 구분 (프로젝트/AS/SS/기타) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right font-semibold">
              구분 <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="구분 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="project">프로젝트</SelectItem>
                <SelectItem value="as_ss">AS/SS</SelectItem>
                <SelectItem value="etc">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 세부 유형 (구분에 따라 다름) */}
          {formData.category !== 'etc' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subType" className="text-right font-semibold">
                세부 유형
              </Label>
              <Select value={formData.subType || 'none'} onValueChange={(value) => handleChange('subType', value === 'none' ? '' : value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {getSubTypeOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 프로젝트 검색 */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2 font-semibold">
              프로젝트
            </Label>
            <div className="col-span-3 relative">
              <div className="relative">
                <Input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value)
                    setShowProjectList(true)
                  }}
                  onFocus={() => setShowProjectList(true)}
                  onBlur={() => {
                    // 약간의 지연을 줘서 클릭 이벤트가 먼저 처리되도록
                    setTimeout(() => setShowProjectList(false), 200)
                  }}
                  placeholder="프로젝트 검색..."
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setProjectSearch('')
                    setShowProjectList(true)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              {showProjectList && filteredProjects.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-600">
                    {projectSearch.trim() 
                      ? `검색 결과 ${filteredProjects.length}개` 
                      : `전체 프로젝트 (${filteredProjects.length}개)`
                    }
                  </div>
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{project.name || project.project_name}</div>
                      {project.project_number && (
                        <div className="text-xs text-gray-500 mt-0.5">{project.project_number}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 시작 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold">
              시작 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-3">
              <div className="flex-1 relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-40 relative">
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

          {/* 종료 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold">
              종료 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-3">
              <div className="flex-1 relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-40 relative">
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

          {/* 장소 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right font-semibold">
              장소 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="pl-9"
                placeholder="방문 장소 입력"
              />
            </div>
          </div>

          {/* 내용 */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="purpose" className="text-right pt-2 font-semibold">
              내용 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 relative">
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                className="min-h-[100px]"
                placeholder="업무 내용을 입력하세요"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {event && (
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                삭제
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (event ? '수정 중...' : '등록 중...') : (event ? '수정하기' : '등록하기')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
