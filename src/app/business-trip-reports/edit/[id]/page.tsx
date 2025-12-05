'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter, useParams } from 'next/navigation'
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
  Loader2
} from "lucide-react"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface BusinessTripReport {
  id: string
  trip_id: string
  user_id: string
  user_name: string
  title: string
  content: string
  attachments: any[]
  submitted_at: string
  approved_by: string | null
  approved_at: string | null
  status: string
  created_at: string
  updated_at: string
  business_trips: {
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
  }
}

export default function BusinessTripReportEditPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string
  
  const [report, setReport] = useState<BusinessTripReport | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else {
        setIsAdmin(user?.level === '5' || user?.level === 'administrator')
        fetchReport()
      }
    }
  }, [isAuthenticated, authLoading, router, user, reportId])

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/business-trip-reports/${reportId}`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-level': String(user?.level || '1')
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('보고서를 찾을 수 없습니다.')
        }
        throw new Error('보고서를 불러오는 데 실패했습니다.')
      }
      
      const data = await response.json()
      const reportData = data.report || data
      setReport(reportData)
      setFormData({
        title: reportData.title || '',
        content: reportData.content || ''
      })
      
      // 편집 권한 체크
      const userIsAdmin = user?.level === '5' || user?.level === 'administrator'
      const isAuthor = reportData.user_id === user?.id
      
      if (reportData.status === 'approved' && !userIsAdmin) {
        setError('승인된 보고서는 수정할 수 없습니다.')
      } else if (!userIsAdmin && !isAuthor) {
        setError('이 보고서를 수정할 권한이 없습니다.')
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
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/business-trip-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          title: formData.title,
          content: formData.content
        })
      })
      
      if (!response.ok) {
        throw new Error('보고서 수정에 실패했습니다.')
      }
      
      alert('보고서가 수정되었습니다.')
      router.push(`/business-trip-reports/${reportId}`)
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
          <p className="text-gray-500">보고서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-500 mb-4">{error || '보고서를 찾을 수 없습니다.'}</p>
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
            onClick={() => router.push(`/business-trip-reports/${reportId}`)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            보고서 수정
          </h1>
        </div>

        {/* 출장/외근 정보 (읽기 전용) */}
        <Card className="mb-6 border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-blue-900 flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              출장/외근 정보
              {report.business_trips?.trip_type && (
                <span className="ml-2">{getTripTypeBadge(report.business_trips.trip_type)}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{report.business_trips?.title || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{report.business_trips?.location || '-'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{report.business_trips?.user_name || report.user_name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">
                    {report.business_trips?.start_date && format(new Date(report.business_trips.start_date), 'yyyy년 M월 d일', { locale: ko })}
                    {report.business_trips?.end_date && report.business_trips.start_date !== report.business_trips.end_date && 
                      ` ~ ${format(new Date(report.business_trips.end_date), 'yyyy년 M월 d일', { locale: ko })}`}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">
                    {report.business_trips?.start_time || '09:00'} ~ {report.business_trips?.end_time || '18:00'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 보고서 편집 폼 */}
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
                  placeholder="출장/외근 내용을 상세히 작성해주세요.&#10;&#10;예시:&#10;1. 방문 목적 및 일정&#10;2. 주요 업무 내용&#10;3. 미팅 참석자 및 논의 사항&#10;4. 결과 및 후속 조치 사항"
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
              onClick={() => router.push(`/business-trip-reports/${reportId}`)}
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
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


