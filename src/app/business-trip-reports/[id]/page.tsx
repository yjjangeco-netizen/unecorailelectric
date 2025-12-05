'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  RotateCcw,
  Target,
  Building
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

export default function BusinessTripReportDetailPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string
  
  const [report, setReport] = useState<BusinessTripReport | null>(null)
  const [loading, setLoading] = useState(true)
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
      setReport(data.report || data)
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!report) return
    
    const newStatus = report.status === 'approved' ? 'submitted' : 'approved'
    const message = report.status === 'approved' ? '승인을 취소하시겠습니까?' : '보고서를 승인하시겠습니까?'
    
    if (!confirm(message)) return

    try {
      const response = await fetch('/api/business-trip-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          status: newStatus,
          approvedBy: newStatus === 'approved' ? user?.id : null
        })
      })
      
      if (!response.ok) throw new Error('상태 변경 실패')
      
      alert(newStatus === 'approved' ? '승인되었습니다.' : '승인이 취소되었습니다.')
      fetchReport()
    } catch (err: any) {
      alert(`오류: ${err.message}`)
    }
  }

  const handleReject = async () => {
    if (!report) return
    
    const reason = prompt('반려 사유를 입력하세요:')
    if (!reason) return

    try {
      const response = await fetch('/api/business-trip-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          status: 'rejected',
          rejectReason: reason
        })
      })
      
      if (!response.ok) throw new Error('반려 실패')
      
      alert('반려되었습니다.')
      fetchReport()
    } catch (err: any) {
      alert(`오류: ${err.message}`)
    }
  }

  const handleDelete = async () => {
    if (!report) return
    
    if (!confirm('정말로 이 보고서를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/business-trip-reports/${report.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('보고서 삭제 실패')
      
      alert('보고서가 삭제되었습니다.')
      router.push('/business-trip-reports')
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`)
    }
  }

  const canEdit = () => {
    if (!report) return false
    if (isAdmin && report.status !== 'approved') return true
    const isAuthor = report.user_id === user?.id
    if (isAuthor && (report.status === 'rejected' || report.status === 'submitted')) return true
    return false
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><FileText className="h-3 w-3 mr-1" />제출됨</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />승인됨</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />반려됨</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">알 수 없음</Badge>
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
            onClick={() => router.push('/business-trip-reports')}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(report.status)}
                {report.business_trips?.trip_type && getTripTypeBadge(report.business_trips.trip_type)}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button 
                    variant={report.status === 'approved' ? 'outline' : 'default'}
                    size="sm" 
                    className={report.status === 'approved' ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'bg-green-600 hover:bg-green-700 text-white'}
                    onClick={handleApprove}
                  >
                    {report.status === 'approved' ? (
                      <><RotateCcw className="h-4 w-4 mr-1" />승인취소</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-1" />승인</>
                    )}
                  </Button>
                  
                  {report.status !== 'approved' && report.status !== 'rejected' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={handleReject}
                    >
                      <XCircle className="h-4 w-4 mr-1" />반려
                    </Button>
                  )}
                </>
              )}
              
              {canEdit() && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/business-trip-reports/edit/${report.id}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />편집
                </Button>
              )}
              
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 출장/외근 정보 */}
        <Card className="mb-6 border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-blue-900 flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              출장/외근 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Target className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">제목</p>
                    <p className="text-sm font-medium text-gray-900">{report.business_trips?.title || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Building className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">목적</p>
                    <p className="text-sm font-medium text-gray-900">{report.business_trips?.purpose || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">장소</p>
                    <p className="text-sm font-medium text-gray-900">{report.business_trips?.location || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">담당자</p>
                    <p className="text-sm font-medium text-gray-900">{report.business_trips?.user_name || report.user_name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">기간</p>
                    <p className="text-sm font-medium text-gray-900">
                      {report.business_trips?.start_date && format(new Date(report.business_trips.start_date), 'yyyy년 M월 d일', { locale: ko })}
                      {report.business_trips?.end_date && report.business_trips.start_date !== report.business_trips.end_date && 
                        ` ~ ${format(new Date(report.business_trips.end_date), 'yyyy년 M월 d일', { locale: ko })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">시간</p>
                    <p className="text-sm font-medium text-gray-900">
                      {report.business_trips?.start_time || '09:00'} ~ {report.business_trips?.end_time || '18:00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 보고서 내용 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              보고서 내용
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                {report.content || '내용이 없습니다.'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메타 정보 */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div>
                <span className="font-medium text-gray-700">제출일:</span>{' '}
                {report.submitted_at && format(new Date(report.submitted_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </div>
              {report.approved_at && (
                <div>
                  <span className="font-medium text-gray-700">승인일:</span>{' '}
                  {format(new Date(report.approved_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">최종 수정:</span>{' '}
                {report.updated_at && format(new Date(report.updated_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


