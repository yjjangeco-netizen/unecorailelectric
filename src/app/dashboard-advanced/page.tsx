'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  Users, 
  FolderOpen, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  FileText,
  MapPin,
  Coffee,
  Sun,
  Target,
  DollarSign,
  Activity,
  Bell,
  Settings
} from 'lucide-react'
import CommonHeader from '@/components/CommonHeader'

interface DashboardStats {
  // 사용자 통계
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  
  // 프로젝트 통계
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalBudget: number
  avgProgress: number
  
  // 업무일지 통계
  totalWorkDiaries: number
  workDiariesThisMonth: number
  totalWorkHours: number
  
  // 출장/외근 통계
  totalTrips: number
  pendingTrips: number
  approvedTrips: number
  tripsThisMonth: number
  
  // 연차/반차 통계
  totalLeaveRequests: number
  pendingLeaveRequests: number
  approvedLeaveRequests: number
  leaveRequestsThisMonth: number
  
  // 재고 통계
  totalStockItems: number
  lowStockItems: number
  totalStockValue: number
  recentTransactions: number
}

interface RecentActivity {
  id: string
  type: 'work_diary' | 'trip' | 'leave' | 'project' | 'stock'
  title: string
  description: string
  user: string
  timestamp: string
  status?: string
}

export default function DashboardAdvancedPage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    avgProgress: 0,
    totalWorkDiaries: 0,
    workDiariesThisMonth: 0,
    totalWorkHours: 0,
    totalTrips: 0,
    pendingTrips: 0,
    approvedTrips: 0,
    tripsThisMonth: 0,
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
    approvedLeaveRequests: 0,
    leaveRequestsThisMonth: 0,
    totalStockItems: 0,
    lowStockItems: 0,
    totalStockValue: 0,
    recentTransactions: 0
  })
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')

  // 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    setLoadingData(true)
    try {
      const [
        usersRes,
        projectsRes,
        workDiariesRes,
        tripsRes,
        leaveRes,
        stockRes,
        activitiesRes
      ] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/projects'),
        fetch('/api/work-diaries'),
        fetch('/api/business-trips'),
        fetch('/api/leave-requests'),
        fetch('/api/stock-items'),
        fetch('/api/recent-activities')
      ])

      // 통계 데이터 처리
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] }
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] }
      const workDiariesData = workDiariesRes.ok ? await workDiariesRes.json() : { diaries: [] }
      const tripsData = tripsRes.ok ? await tripsRes.json() : { trips: [] }
      const leaveData = leaveRes.ok ? await leaveRes.json() : { requests: [] }
      const stockData = stockRes.ok ? await stockRes.json() : { items: [] }
      const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] }

      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()

      setStats({
        totalUsers: usersData.users?.length || 0,
        activeUsers: usersData.users?.filter((u: any) => u.is_active).length || 0,
        newUsersThisMonth: usersData.users?.filter((u: any) => {
          const createdDate = new Date(u.created_at)
          return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear
        }).length || 0,
        
        totalProjects: projectsData.projects?.length || 0,
        activeProjects: projectsData.projects?.filter((p: any) => p.status === 'active').length || 0,
        completedProjects: projectsData.projects?.filter((p: any) => p.status === 'completed').length || 0,
        totalBudget: projectsData.projects?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0,
        avgProgress: projectsData.projects?.length > 0 ? 
          Math.round(projectsData.projects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / projectsData.projects.length) : 0,
        
        totalWorkDiaries: workDiariesData.diaries?.length || 0,
        workDiariesThisMonth: workDiariesData.diaries?.filter((d: any) => {
          const diaryDate = new Date(d.work_date)
          return diaryDate.getMonth() === thisMonth && diaryDate.getFullYear() === thisYear
        }).length || 0,
        totalWorkHours: workDiariesData.diaries?.reduce((sum: number, d: any) => sum + (d.total_hours || 0), 0) || 0,
        
        totalTrips: tripsData.trips?.length || 0,
        pendingTrips: tripsData.trips?.filter((t: any) => t.status === 'pending').length || 0,
        approvedTrips: tripsData.trips?.filter((t: any) => t.status === 'approved').length || 0,
        tripsThisMonth: tripsData.trips?.filter((t: any) => {
          const tripDate = new Date(t.start_date)
          return tripDate.getMonth() === thisMonth && tripDate.getFullYear() === thisYear
        }).length || 0,
        
        totalLeaveRequests: leaveData.requests?.length || 0,
        pendingLeaveRequests: leaveData.requests?.filter((l: any) => l.status === 'pending').length || 0,
        approvedLeaveRequests: leaveData.requests?.filter((l: any) => l.status === 'approved').length || 0,
        leaveRequestsThisMonth: leaveData.requests?.filter((l: any) => {
          const requestDate = new Date(l.start_date)
          return requestDate.getMonth() === thisMonth && requestDate.getFullYear() === thisYear
        }).length || 0,
        
        totalStockItems: stockData.items?.length || 0,
        lowStockItems: stockData.items?.filter((s: any) => s.current_stock <= s.min_stock).length || 0,
        totalStockValue: stockData.items?.reduce((sum: number, s: any) => sum + (s.current_stock * (s.unit_price || 0)), 0) || 0,
        recentTransactions: stockData.transactions?.length || 0
      })

      setRecentActivities(activitiesData.activities || [])
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoadingData(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      work_diary: FileText,
      trip: MapPin,
      leave: Sun,
      project: FolderOpen,
      stock: Package
    } as const

    const Icon = icons[type as keyof typeof icons] || Activity
    return <Icon className="w-4 h-4" />
  }

  const getActivityColor = (type: string) => {
    const colors = {
      work_diary: 'text-blue-600',
      trip: 'text-green-600',
      leave: 'text-yellow-600',
      project: 'text-purple-600',
      stock: 'text-orange-600'
    } as const

    return colors[type as keyof typeof colors] || 'text-gray-600'
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
            <h1 className="text-3xl font-bold text-gray-900">통합 대시보드</h1>
            <p className="text-gray-600">전체 시스템 현황을 한눈에 확인하세요</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDashboardData}>
              <Activity className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              설정
            </Button>
          </div>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500">활성: {stats.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">진행중 프로젝트</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeProjects}</p>
                  <p className="text-xs text-gray-500">완료: {stats.completedProjects}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">대기중 승인</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingTrips + stats.pendingLeaveRequests}</p>
                  <p className="text-xs text-gray-500">출장: {stats.pendingTrips}, 연차: {stats.pendingLeaveRequests}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">재고 부족</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
                  <p className="text-xs text-gray-500">총 재고: {stats.totalStockItems}</p>
                </div>
                <Package className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 세부 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 프로젝트 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                프로젝트 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>전체 프로젝트</span>
                <span className="font-semibold">{stats.totalProjects}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span>진행률</span>
                <span className="font-semibold">{stats.avgProgress}%</span>
              </div>
              <Progress value={stats.avgProgress} className="h-2" />
              <div className="flex justify-between items-center">
                <span>총 예산</span>
                <span className="font-semibold">{formatCurrency(stats.totalBudget)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 업무 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                업무 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>이번 달 업무일지</span>
                <span className="font-semibold">{stats.workDiariesThisMonth}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span>총 근무시간</span>
                <span className="font-semibold">{stats.totalWorkHours}시간</span>
              </div>
              <div className="flex justify-between items-center">
                <span>이번 달 출장/외근</span>
                <span className="font-semibold">{stats.tripsThisMonth}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span>이번 달 연차/반차</span>
                <span className="font-semibold">{stats.leaveRequestsThisMonth}건</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              최근 활동
            </CardTitle>
            <CardDescription>시스템에서 발생한 최근 활동들을 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">활동을 불러오는 중...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">최근 활동이 없습니다</h3>
                <p className="text-gray-600">시스템을 사용하면 여기에 활동이 표시됩니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`${getActivityColor(activity.type)} mt-1`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </h4>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{activity.user}</span>
                        <span>·</span>
                        <span>{formatDate(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
            <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/work-diary/write')}
              >
                <FileText className="w-6 h-6" />
                <span>업무일지 작성</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/business-trip-management')}
              >
                <MapPin className="w-6 h-6" />
                <span>출장/외근 신청</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/leave-management')}
              >
                <Sun className="w-6 h-6" />
                <span>연차/반차 신청</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/stock-management')}
              >
                <Package className="w-6 h-6" />
                <span>재고 관리</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
