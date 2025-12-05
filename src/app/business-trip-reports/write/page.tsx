'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Save,
  FileText,
  MapPin,
  Calendar,
  Clock,
  User,
  Briefcase,
  XCircle,
  Loader2,
  Send
} from "lucide-react"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface BusinessTrip {
  id: string
  title: string
  purpose: string
  location: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  user_name: string
  user_id: string
  trip_type: string
  category: string
  description: string
  status: string
  report_status: string
}

function WriteReportContent() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get('tripId')
  
  const [trip, setTrip] = useState<BusinessTrip | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (tripId) {
        fetchTrip()
      } else {
        setError('출장/외근 ID가 필요합니다.')
        setLoading(false)
      }
    }
  }, [isAuthenticated, authLoading, router, user, tripId])

  const fetchTrip = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/business-trips/${tripId}`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-level': String(user?.level || '1')
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('출장/외근 정보를 찾을 수 없습니다.')
        }
        throw new Error('정보를 불러오는 데 실패했습니다.')
      }
      
      const data = await response.json()
      const tripData = data.trip || data
      setTrip(tripData)
      
      // 기본 제목 설정
      setFormData(prev => ({
        ...prev,
        title: `${tripData.title} 보고서`
      }))
      
      // 이미 보고서가 제출된 경우
      if (tripData.report_status === 'submitted') {
        setError('이미 보고서가 제출된 출장/외근입니다.')
      }
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('보고서 제목을 입력해주세요.')
      return
    }
    
    if (!formData.content.trim()) {
      alert('보고서 내용을 입력해주세요.')
      return
    }
    
    if (!trip) {
      alert('출장/외근 정보가 없습니다.')
      return
    }
    
    setSaving(true)
    
    try {
      // 1. 보고서 생성
      const reportResponse = await fetch('/api/business-trip-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          userId: user?.id,
          userName: user?.name,
          title: formData.title,
          content: formData.content
        })
      })
      
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json()
        throw new Error(errorData.error || '보고서 제출에 실패했습니다.')
      }
      
      alert('보고서가 제출되었습니다.')
      router.push('/business-trip-reports')
    } catch (err: any) {
      alert(`오류: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getTripTypeBadge = (type: string) => {
    switch (type) {
      case 'business_trip':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">출장</Badge>
      case 'field_work':
        return <Badge variant="outline" className="text-teal-600 border-teal-300">외근</Badge>
      default:
        return <Badge variant="outline">기타</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500">정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-500 mb-4">{error || '정보를 찾을 수 없습니다.'}</p>
            <Button onClick={() => router.push('/business-trip-reports')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/business-trip-reports')}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            보고서 작성
          </h1>
          <p className="text-gray-500 mt-1">출장/외근에 대한 보고서를 작성해주세요.</p>
        </div>

        {/* 출장/외근 정보 (읽기 전용) */}
        <Card className="mb-6 border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-blue-900 flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              출장/외근 정보
              {trip.trip_type && (
                <span className="ml-2">{getTripTypeBadge(trip.trip_type)}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">제목</p>
                    <p className="text-sm font-medium text-gray-900">{trip.title}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Briefcase className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">목적</p>
                    <p className="text-sm font-medium text-gray-900">{trip.purpose}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">장소</p>
                    <p className="text-sm font-medium text-gray-900">{trip.location}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">담당자</p>
                    <p className="text-sm font-medium text-gray-900">{trip.user_name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">기간</p>
                    <p className="text-sm font-medium text-gray-900">
                      {trip.start_date && format(new Date(trip.start_date), 'yyyy년 M월 d일', { locale: ko })}
                      {trip.end_date && trip.start_date !== trip.end_date && 
                        ` ~ ${format(new Date(trip.end_date), 'yyyy년 M월 d일', { locale: ko })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">시간</p>
                    <p className="text-sm font-medium text-gray-900">
                      {trip.start_time || '09:00'} ~ {trip.end_time || '18:00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {trip.description && (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <p className="text-xs text-gray-500 mb-1">설명</p>
                <p className="text-sm text-gray-700">{trip.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 보고서 작성 폼 */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                보고서 작성
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  보고서 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="보고서 제목을 입력하세요"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  보고서 내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder={`출장/외근 내용을 상세히 작성해주세요.

예시:
1. 방문 목적 및 일정
2. 주요 업무 내용
3. 미팅 참석자 및 논의 사항
4. 결과 및 후속 조치 사항
5. 특이사항 및 건의사항`}
                  className="bg-white min-h-[300px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/business-trip-reports')}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  보고서 제출
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BusinessTripReportWritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    }>
      <WriteReportContent />
    </Suspense>
  )
}


