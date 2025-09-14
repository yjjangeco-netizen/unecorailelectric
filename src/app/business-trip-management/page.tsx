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
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
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
  FileText
} from 'lucide-react'
import CommonHeader from '@/components/CommonHeader'

interface BusinessTrip {
  id: string
  user_id: string
  project_id?: string
  trip_type: 'business_trip' | 'field_work'
  sub_type: string
  title: string
  description: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  location: string
  purpose: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  companions: string[]
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  project_number: string
}

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  department: string
  position: string
}

export default function BusinessTripManagementPage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()
  
  const [trips, setTrips] = useState<BusinessTrip[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  
  // 필터 및 검색
  const [filters, setFilters] = useState({
    status: 'all',
    trip_type: 'all',
    project: 'all',
    date_range: 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')
  
  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<BusinessTrip | null>(null)

  // 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [tripsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/business-trips'),
        fetch('/api/projects'),
        fetch('/api/users')
      ])

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json()
        setTrips(tripsData.trips || [])
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
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
  const filteredTrips = trips.filter(trip => {
    const matchesStatus = filters.status === 'all' || trip.status === filters.status
    const matchesType = filters.trip_type === 'all' || trip.trip_type === filters.trip_type
    const matchesProject = filters.project === 'all' || trip.project_id === filters.project
    const matchesSearch = searchTerm === '' || 
      trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesProject && matchesSearch
  })

  // 통계 계산
  const stats = {
    total: trips.length,
    pending: trips.filter(t => t.status === 'pending').length,
    approved: trips.filter(t => t.status === 'approved').length,
    completed: trips.filter(t => t.status === 'completed').length,
    thisMonth: trips.filter(t => {
      const tripDate = new Date(t.start_date)
      const now = new Date()
      return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear()
    }).length
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      completed: 'outline'
    } as const

    const icons = {
      pending: AlertTriangle,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle
    } as const

    const Icon = icons[status as keyof typeof icons]

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'business_trip' ? '출장' : 
         status === 'field_work' ? '외근' : 
         status === 'pending' ? '대기' :
         status === 'approved' ? '승인' :
         status === 'rejected' ? '거부' :
         status === 'completed' ? '완료' : status}
      </Badge>
    )
  }

  const getTripTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'business_trip' ? 'default' : 'secondary'}>
        {type === 'business_trip' ? '출장' : '외근'}
      </Badge>
    )
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
      <CommonHeader currentUser={user} isAdmin={user?.level === 'admin'} />
      
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">출장/외근 관리</h1>
            <p className="text-gray-600">출장 및 외근 신청을 관리하고 승인하세요</p>
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
                    placeholder="제목, 장소로 검색..."
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
                    <SelectItem value="completed">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>구분</Label>
                <Select
                  value={filters.trip_type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, trip_type: value }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="business_trip">출장</SelectItem>
                    <SelectItem value="field_work">외근</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>프로젝트</Label>
                <Select
                  value={filters.project}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" onClick={() => setFilters({
                status: 'all',
                trip_type: 'all',
                project: 'all',
                date_range: 'all'
              })}>
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 출장/외근 목록 */}
        <div className="space-y-4">
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">출장/외근 신청이 없습니다</h3>
                <p className="text-gray-600">새로운 출장 또는 외근을 신청해보세요.</p>
              </CardContent>
            </Card>
          ) : (
            filteredTrips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
                        {getTripTypeBadge(trip.trip_type)}
                        {getStatusBadge(trip.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{trip.start_date} ~ {trip.end_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{trip.start_time} ~ {trip.end_time}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{trip.description}</p>
                      
                      {trip.companions.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Users className="w-4 h-4" />
                          <span>동행자: {trip.companions.length}명</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTrip(trip)
                          setShowDetailModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTrip(trip)
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
