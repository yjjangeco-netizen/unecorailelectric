'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CommonHeader from '@/components/CommonHeader'
import { 
  Briefcase, 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Level2 이상 권한 확인
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const userLevel = user.level || '1'
      if (userLevel === '1') {
        router.push('/dashboard')
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  // 출장/외근 보고서 로드
  useEffect(() => {
    const loadReports = async () => {
      if (!user?.id) return
      
      setLoading(true)
      try {
        // 레벨 5 이상은 모든 보고서, 그 외는 자신의 것만
        const isLevel5OrAdmin = user.level === '5' || user.level === 'administrator'
        const apiUrl = isLevel5OrAdmin 
          ? '/api/business-trip-reports' 
          : `/api/business-trip-reports?userId=${user.id}`
        
        const response = await fetch(apiUrl)
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports || [])
        } else {
          setError('보고서를 가져오는데 실패했습니다.')
        }
      } catch (error) {
        console.error('보고서 로드 오류:', error)
        setError('보고서를 가져오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user) {
      loadReports()
    }
  }, [isAuthenticated, user])

  // 필터링된 보고서
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.business_trips.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.business_trips.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    
    const matchesDate = !dateFilter || report.submitted_at.startsWith(dateFilter)
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Level1 사용자는 접근 불가
  if (user?.level === '1') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 공통 헤더 */}
      <CommonHeader
        currentUser={user}
        isAdmin={user?.level === 'administrator'}
        title="출장/외근 보고서"
        backUrl="/work-diary"
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* 필터 섹션 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              보고서 검색 및 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 검색 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="제목, 작성자, 장소로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">상태</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="submitted">제출됨</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">반려됨</option>
                </select>
              </div>

              {/* 날짜 필터 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">제출일</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 보고서 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                출장/외근 보고서 목록
              </div>
              <span className="text-sm text-gray-500">
                총 {filteredReports.length}건
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">보고서를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  다시 시도
                </Button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">보고서가 없습니다</h3>
                <p className="text-gray-600">출장/외근 보고서가 없거나 검색 조건에 맞는 보고서가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(report.status)}`}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{getStatusText(report.status)}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              <span>작성자: {report.business_trips.user_name}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>장소: {report.business_trips.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>기간: {report.business_trips.start_date} ~ {report.business_trips.end_date}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>제출일: {formatDate(report.submitted_at)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {report.content}
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 보고서 상세 보기 (모달 또는 별도 페이지)
                              alert('보고서 상세 보기 기능은 준비 중입니다.')
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            상세보기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
