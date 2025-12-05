'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  FileText,
  MapPin,
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  RotateCcw
} from "lucide-react"

interface BusinessTripReport {
  id: string
  title: string
  content: string
  submitted_at: string
  status: string
  user_id: string
  business_trips: {
    id: string
    title: string
    purpose: string
    location: string
    start_date: string
    end_date: string
    user_name: string
    user_id: string
  }
}

export default function BusinessTripReportsPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [reports, setReports] = useState<BusinessTripReport[]>([])
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreportedTrips, setUnreportedTrips] = useState<any[]>([]) // To store trips without reports
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else {
        // Check if user is admin (Level 5 또는 Administrator)
        const level = String(user?.level || '').toLowerCase()
        const isAdminUser = level === '5' || level === 'administrator' || level === 'admin' || user?.id === 'admin'
        console.log('User level check:', { level: user?.level, userId: user?.id, isAdmin: isAdminUser })
        setIsAdmin(isAdminUser)
        fetchReportsAndUnreportedTrips()
      }
    }
  }, [isAuthenticated, authLoading, router, user])

  const fetchReportsAndUnreportedTrips = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = {
        'x-user-id': user?.id || '',
        'x-user-level': String(user?.level || '1')
      }

      const reportsResponse = await fetch('/api/business-trip-reports', { headers })
      if (!reportsResponse.ok) {
        throw new Error('Failed to fetch business trip reports')
      }
      const reportsData = await reportsResponse.json()
      // API가 { reports: [...] } 또는 배열 직접 반환
      setReports(reportsData.reports || reportsData || [])

      const unreportedResponse = await fetch('/api/business-trips/unreported', { headers })
      if (!unreportedResponse.ok) {
        throw new Error('Failed to fetch unreported business trips')
      }
      const unreportedData = await unreportedResponse.json()
      setUnreportedTrips(unreportedData.trips || [])

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('정말로 이 출장 내역을 삭제하시겠습니까? 관련 보고서도 삭제될 수 있습니다.')) {
      return
    }
    try {
      const response = await fetch(`/api/business-trips/${tripId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete business trip')
      }
      alert('출장 내역이 성공적으로 삭제되었습니다.')
      fetchReportsAndUnreportedTrips() // Refresh data
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`)
    }
  }

  // 보고서 삭제
  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('정말로 이 보고서를 삭제하시겠습니까?')) {
      return
    }
    try {
      const response = await fetch(`/api/business-trip-reports/${reportId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('보고서 삭제 실패')
      }
      alert('보고서가 삭제되었습니다.')
      fetchReportsAndUnreportedTrips()
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`)
    }
  }

  // 보고서 승인
  const handleApprove = async (reportId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = currentStatus === 'approved' ? 'submitted' : 'approved'
    const message = currentStatus === 'approved' ? '승인을 취소하시겠습니까?' : '보고서를 승인하시겠습니까?'
    
    if (!confirm(message)) return

    try {
      const response = await fetch('/api/business-trip-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          status: newStatus,
          approvedBy: newStatus === 'approved' ? user?.id : null
        })
      })
      if (!response.ok) throw new Error('상태 변경 실패')
      alert(newStatus === 'approved' ? '승인되었습니다.' : '승인이 취소되었습니다.')
      fetchReportsAndUnreportedTrips()
    } catch (err: any) {
      alert(`오류: ${err.message}`)
    }
  }

  // 보고서 반려
  const handleReject = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const reason = prompt('반려 사유를 입력하세요:')
    if (!reason) return

    try {
      const response = await fetch('/api/business-trip-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          status: 'rejected',
          rejectReason: reason
        })
      })
      if (!response.ok) throw new Error('반려 실패')
      alert('반려되었습니다.')
      fetchReportsAndUnreportedTrips()
    } catch (err: any) {
      alert(`오류: ${err.message}`)
    }
  }

  // 편집 가능 여부 확인
  const canEdit = (report: BusinessTripReport) => {
    // Level 5 이상은 승인 전까지 언제든 편집 가능
    if (isAdmin) {
      return report.status !== 'approved'
    }
    // 작성자는 반려된 경우에만 편집 가능
    const isAuthor = report.user_id === user?.id || report.business_trips?.user_id === user?.id
    if (isAuthor && report.status === 'rejected') {
      return true
    }
    // 작성자가 제출 상태일 때도 편집 가능
    if (isAuthor && report.status === 'submitted') {
      return true
    }
    return false
  }

  // 삭제 가능 여부 확인
  const canDelete = () => {
    return isAdmin
  }

  const filteredReports = Array.isArray(reports) ? reports.filter(report => {
    const matchesSearch =
      (report.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.business_trips?.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.business_trips?.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter

    // 날짜 범위 필터
    let matchesDate = true
    if (startDateFilter || endDateFilter) {
      const reportDate = report.submitted_at ? new Date(report.submitted_at) : null
      if (reportDate) {
        if (startDateFilter) {
          matchesDate = matchesDate && reportDate >= new Date(startDateFilter)
        }
        if (endDateFilter) {
          const endDate = new Date(endDateFilter)
          endDate.setHours(23, 59, 59, 999)
          matchesDate = matchesDate && reportDate <= endDate
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  }) : []

  const handleReset = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setStartDateFilter('')
    setEndDateFilter('')
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('ko-KR', options)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return '제출됨'
      case 'approved':
        return '승인됨'
      case 'rejected':
        return '반려됨'
      default:
        return '알 수 없음'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="h-3 w-3" />
      case 'approved':
        return <CheckCircle className="h-3 w-3" />
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* 미보고 내역 섹션 */}
        {unreportedTrips.length > 0 ? (
          <Card className="mb-8 border border-red-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-red-50/50 border-b border-red-100 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-red-900 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-red-500" />
                  미보고 내역
                </h3>
                <span className="text-sm text-red-600 font-medium bg-red-100 px-2.5 py-0.5 rounded-full">
                  {unreportedTrips.length}건
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-red-100">
                {unreportedTrips.map((trip) => (
                  <div key={trip.id} className="p-4 hover:bg-red-50/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-gray-900 truncate">{trip.title}</span>
                        <span className="text-xs text-red-600 border border-red-200 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">미보고</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center whitespace-nowrap">
                          <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {trip.user_name}
                        </div>
                        <div className="flex items-center whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {new Date(trip.start_date).toLocaleDateString()} ~ {new Date(trip.end_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center whitespace-nowrap">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {trip.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      {/* 보고서 작성 버튼 - 본인 신청건만 표시 */}
                      {trip.user_id === user?.id && (
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                          onClick={() => router.push(`/business-trip-reports/write?tripId=${trip.id}`)}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          보고서 작성
                        </Button>
                      )}
                      {/* 본인 것이 아닌 경우 안내 메시지 */}
                      {trip.user_id !== user?.id && (
                        <span className="text-xs text-gray-500">신청자만 작성 가능</span>
                      )}
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteTrip(trip.id)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 bg-gray-50 border-dashed border-gray-300">
            <CardContent className="p-8 text-center text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
              <p>미보고된 내역이 없습니다.</p>
            </CardContent>
          </Card>
        )}

        <div className="border-t border-gray-200 my-8"></div>

        {/* 필터 섹션 */}
        <Card className="mb-6 border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 검색 */}
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-sm font-medium text-gray-700">검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="제목, 작성자, 장소로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">상태</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="submitted">제출됨</SelectItem>
                    <SelectItem value="approved">승인됨</SelectItem>
                    <SelectItem value="rejected">반려됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 시작일 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">시작일</Label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* 종료일 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">종료일</Label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleReset}
                className="px-4"
              >
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 보고서 목록 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            보고서 목록
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">보고서를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">제출된 보고서가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className={`hover:shadow-md transition-shadow border-gray-200 ${report.status === 'approved' ? 'border-l-4 border-l-green-500' : report.status === 'rejected' ? 'border-l-4 border-l-red-500' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 cursor-pointer" onClick={() => router.push(`/business-trip-reports/${report.id}`)}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)} flex items-center gap-1`}>
                            {getStatusIcon(report.status)}
                            {getStatusText(report.status)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(report.submitted_at)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1.5 text-gray-400" />
                            {report.business_trips?.user_name || '알 수 없음'}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                            {report.business_trips?.location || '미지정'}
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1.5 text-gray-400" />
                            {report.business_trips?.purpose || ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 승인/승인취소 버튼 - Level 5 이상만 */}
                        {isAdmin && (
                          <Button 
                            variant={report.status === 'approved' ? 'outline' : 'default'}
                            size="sm" 
                            className={report.status === 'approved' ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'bg-green-600 hover:bg-green-700 text-white'}
                            onClick={(e) => handleApprove(report.id, report.status, e)}
                          >
                            {report.status === 'approved' ? (
                              <>
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                승인취소
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                승인
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* 반려 버튼 - Level 5 이상, 승인되지 않은 경우만 */}
                        {isAdmin && report.status !== 'approved' && report.status !== 'rejected' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={(e) => handleReject(report.id, e)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            반려
                          </Button>
                        )}

                        {/* 편집 버튼 - 편집 가능한 경우만 */}
                        {canEdit(report) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/business-trip-reports/edit/${report.id}`)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            편집
                          </Button>
                        )}

                        {/* 삭제 버튼 - Level 5 이상만 */}
                        {canDelete() && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDeleteReport(report.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/business-trip-reports/${report.id}`)
                          }}
                        >
                          상세 보기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
