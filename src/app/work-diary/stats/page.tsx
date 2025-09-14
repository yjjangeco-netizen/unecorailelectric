'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface WorkDiaryStats {
  overview: {
    totalEntries: number
    uniqueUsers: number
    uniqueProjects: number
    dateRange: {
      start: number | null
      end: number | null
    }
  }
  workTypeStats: Array<{
    name: string
    count: number
    uniqueUsers: number
    uniqueProjects: number
  }>
  workSubTypeStats: Array<{
    name: string
    count: number
    uniqueUsers: number
    uniqueProjects: number
  }>
  projectStats: Array<{
    name: string
    count: number
    uniqueUsers: number
    uniqueProjects: number
    workTypes?: string[]
    workSubTypes?: string[]
  }>
  projectCategoryStats: Array<{
    name: string
    count: number
    uniqueUsers: number
    uniqueProjects: number
    workTypes?: string[]
    workSubTypes?: string[]
  }>
  dateStats: Array<{
    date: string
    count: number
    uniqueUsers: number
    uniqueProjects: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function WorkDiaryStatsPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<WorkDiaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedView, setSelectedView] = useState('overview')

  // 인증 상태 확인 및 권한 검사
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    if (!authLoading && isAuthenticated && user) {
      const userLevel = user.level || '1'
      console.log('사용자 레벨:', userLevel, '타입:', typeof userLevel)
      
      // level을 문자열로 변환
      const levelStr = String(userLevel)
      
      if (levelStr !== '5' && levelStr !== 'admin') {
        console.log('권한 없음 - 대시보드로 리다이렉트')
        router.push('/dashboard')
        return
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      const userLevel = user.level || '1'
      const levelStr = String(userLevel)
      
      if (levelStr === '5' || levelStr === 'admin') {
        console.log('권한 있음 - 통계 데이터 로드')
        fetchStats()
      }
    }
  }, [startDate, endDate, isAuthenticated, user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`/api/work-diary/stats?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR')
  }

  // 로딩 중이거나 인증 중인 경우
  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">통계를 불러오는 중...</div>
      </div>
    )
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">로그인이 필요합니다.</div>
      </div>
    )
  }

  // 권한이 없는 경우
  if (user) {
    const userLevel = user.level || '1'
    const levelStr = String(userLevel)
    
    if (levelStr !== '5' && levelStr !== 'admin') {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center text-red-500">
            <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
            <p>업무통계는 Level 5 이상 또는 관리자만 접근할 수 있습니다.</p>
            <p className="mt-2 text-sm text-gray-600">현재 레벨: {levelStr}</p>
          </div>
        </div>
      )
    }
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">통계 데이터를 불러올 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">업무일지 통계</h1>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <Label>시작일</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2">
            <Label>종료일</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={fetchStats}>새로고침</Button>
        </div>
      </div>

      {/* 개요 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 업무 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalEntries.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">참여 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">프로젝트 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.uniqueProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">기간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.overview.dateRange.start && stats.overview.dateRange.end ? (
                <>
                  {formatDate(stats.overview.dateRange.start)} ~ {formatDate(stats.overview.dateRange.end)}
                </>
              ) : (
                '전체'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프로젝트 카테고리별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 카테고리별 통계 (WSMS vs 기타)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">카테고리별 업무 항목 수</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.projectCategoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">카테고리별 비율</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.projectCategoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.projectCategoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* 카테고리별 상세 정보 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.projectCategoryStats.map((category) => (
              <div key={category.name} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">
                  {category.name === 'WSMS' ? 'WSMS 관련 프로젝트' : '기타 프로젝트'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>업무 항목 수:</span>
                    <span className="font-semibold">{category.count.toLocaleString()}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>참여 사용자:</span>
                    <span className="font-semibold">{category.uniqueUsers}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>프로젝트 수:</span>
                    <span className="font-semibold">{category.uniqueProjects}개</span>
                  </div>
                  {category.workTypes && category.workTypes.length > 0 && (
                    <div>
                      <span className="text-gray-600">주요 작업유형:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {category.workTypes.slice(0, 5).map((type, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작업 유형별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>작업 유형별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.workTypeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.workTypeStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 프로젝트별 통계 (상위 10개) */}
        <Card>
          <CardHeader>
            <CardTitle>프로젝트별 통계 (상위 10개)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.projectStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 날짜별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>날짜별 업무 항목 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dateStats.slice(0, 30)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 상세 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>작업 유형 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.workTypeStats.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-right">
                    <div className="font-bold">{item.count}건</div>
                    <div className="text-sm text-gray-500">
                      {item.uniqueUsers}명, {item.uniqueProjects}개 프로젝트
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>세부 유형 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.workSubTypeStats.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-right">
                    <div className="font-bold">{item.count}건</div>
                    <div className="text-sm text-gray-500">
                      {item.uniqueUsers}명, {item.uniqueProjects}개 프로젝트
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
