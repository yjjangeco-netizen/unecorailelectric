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
  Trash2
} from "lucide-react"

interface BusinessTripReport {
  id: string
  title: string
  content: string
  submitted_at: string
  status: string
  business_trips: {
    id: string
    title: string
    purpose: string
    location: string
    start_date: string
    end_date: string
    user_name: string
  }
}

export default function BusinessTripReportsPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [reports, setReports] = useState<BusinessTripReport[]>([])
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreportedTrips, setUnreportedTrips] = useState<any[]>([]) // To store trips without reports
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else {
        // Check if user is admin
        setIsAdmin(user?.level === '5' || user?.level === 'administrator')
        fetchReportsAndUnreportedTrips()
      }
    }
  }, [isAuthenticated, authLoading, router, user])

  const fetchReportsAndUnreportedTrips = async () => {
    setLoading(true)
    setError(null)
    try {
      const reportsResponse = await fetch('/api/business-trip-reports')
      if (!reportsResponse.ok) {
        throw new Error('Failed to fetch business trip reports')
      }
      const reportsData = await reportsResponse.json()
      setReports(reportsData)

      const unreportedResponse = await fetch('/api/business-trips/unreported')
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

  const filteredReports = Array.isArray(reports) ? reports.filter(report => {
    const matchesSearch =
      (report.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.business_trips?.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.business_trips?.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter

    const matchesDate =
      !dateFilter || (report.submitted_at && report.submitted_at.startsWith(dateFilter))

    return matchesSearch && matchesStatus && matchesDate
  }) : []

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
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                        onClick={() => router.push(`/business-trip-reports/write?tripId=${trip.id}`)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        보고서 작성
                      </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 검색 */}
              <div className="space-y-2">
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

              {/* 날짜 필터 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">제출일</Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white"
                />
              </div>
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
                <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer border-gray-200" onClick={() => router.push(`/business-trip-reports/${report.id}`)}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
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
                            {report.business_trips.user_name}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                            {report.business_trips.location}
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1.5 text-gray-400" />
                            {report.business_trips.purpose}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-gray-600">
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
