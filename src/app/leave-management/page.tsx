'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
  Coffee,
  Sun
} from 'lucide-react'
import CommonHeader from '@/components/CommonHeader'

interface LeaveRequest {
  id: string
  user_id: string
  leave_type: 'annual' | 'half_day' | 'sick' | 'personal'
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  total_days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  department: string
  position: string
  remaining_annual_leave: number
}

export default function LeaveManagementPage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')

  // 필터 및 검색
  const [filters, setFilters] = useState({
    status: 'all',
    leave_type: 'all',
    user: 'all',
    date_range: 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  // 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [leaveRes, usersRes] = await Promise.all([
        fetch('/api/leave-requests'),
        fetch('/api/users')
      ])

      if (leaveRes.ok) {
        const leaveData = await leaveRes.json()
        setLeaveRequests(leaveData.requests || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoadingData(false)
    }
  }

  // 필터링된 데이터
  const filteredRequests = leaveRequests.filter(request => {
    const matchesStatus = filters.status === 'all' || request.status === filters.status
    const matchesType = filters.leave_type === 'all' || request.leave_type === filters.leave_type
    const matchesUser = filters.user === 'all' || request.user_id === filters.user
    const matchesSearch = searchTerm === '' ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesType && matchesUser && matchesSearch
  })

  // 통계 계산
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
    thisMonth: leaveRequests.filter(r => {
      const requestDate = new Date(r.start_date)
      const now = new Date()
      return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear()
    }).length
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    } as const

    const icons = {
      pending: AlertTriangle,
      approved: CheckCircle,
      rejected: XCircle,
      cancelled: XCircle
    } as const

    const Icon = icons[status as keyof typeof icons]

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'pending' ? '대기' :
          status === 'approved' ? '승인' :
            status === 'rejected' ? '거부' :
              status === 'cancelled' ? '취소' : status}
      </Badge>
    )
  }

  const getLeaveTypeBadge = (type: string) => {
    const variants = {
      annual: 'default',
      half_day: 'secondary',
      sick: 'destructive',
      personal: 'outline'
    } as const

    const icons = {
      annual: Sun,
      half_day: Coffee,
      sick: AlertTriangle,
      personal: User
    } as const

    const Icon = icons[type as keyof typeof icons]

    return (
      <Badge variant={variants[type as keyof typeof variants]}>
        <Icon className="w-3 h-3 mr-1" />
        {type === 'annual' ? '연차' :
          type === 'half_day' ? '반차' :
            type === 'sick' ? '병가' :
              type === 'personal' ? '개인' : type}
      </Badge>
    )
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader
        currentUser={user ? { ...user, level: String(user.level) } : null}
        isAdmin={user?.level === 'admin'}
        title="연차/반차 관리"
        backUrl="/"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">연차 / 반차 관리</h1>
            <p className="text-gray-600">연차 및 반차 신청을 관리하고 승인하세요</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            신청하기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 신청</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">대기 중</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">승인됨</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">이번 달</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="사유로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>상태</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="pending">대기</SelectItem>
                    <SelectItem value="approved">승인</SelectItem>
                    <SelectItem value="rejected">거부</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>구분</Label>
                <Select
                  value={filters.leave_type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, leave_type: value }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="annual">연차</SelectItem>
                    <SelectItem value="half_day">반차</SelectItem>
                    <SelectItem value="sick">병가</SelectItem>
                    <SelectItem value="personal">개인</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>사용자</Label>
                <Select
                  value={filters.user}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, user: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={() => setFilters({
                status: 'all',
                leave_type: 'all',
                user: 'all',
                date_range: 'all'
              })}>
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 연차/반차 목록 */}
        <div className="space-y-4">
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">연차/반차 신청이 없습니다</h3>
                <p className="text-gray-600">새로운 연차 또는 반차를 신청해보세요.</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getUserName(request.user_id)}
                        </h3>
                        {getLeaveTypeBadge(request.leave_type)}
                        {getStatusBadge(request.status)}
                        <Badge variant="outline">
                          {request.total_days}일
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{request.start_date} ~ {request.end_date}</span>
                        </div>
                        {request.start_time && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{request.start_time} ~ {request.end_time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{request.leave_type === 'annual' ? '연차' :
                            request.leave_type === 'half_day' ? '반차' :
                              request.leave_type === 'sick' ? '병가' : '개인'}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{request.reason}</p>

                      {request.rejection_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>거부 사유:</strong> {request.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetailModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowEditModal(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
