'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import AuthGuard from '@/components/AuthGuard'
import {
  Search,
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react'

interface WorkDiaryEntry {
  id: number
  userId: string
  workDate: string
  projectId: number
  workContent: string
  createdAt: string
  updatedAt: string
  workType?: string
  workSubType?: string
  customProjectName?: string
  startTime?: string
  endTime?: string
  workHours?: number
  overtimeHours?: number
  project?: {
    id: number
    project_name: string
    project_number: string
    description?: string
  }
  user?: {
    id: string
    name: string
    level: string
    department?: string
    position?: string
  }
}

interface StatResult {
  category: string
  value: number
  details?: any[]
}

export default function AdvancedStatsPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()

  // 상태 관리
  const [searchStartDate, setSearchStartDate] = useState('')
  const [searchEndDate, setSearchEndDate] = useState('')
  const [searchUser, setSearchUser] = useState('all')
  const [searchWorkType, setSearchWorkType] = useState('all')
  const [searchWorkSubType, setSearchWorkSubType] = useState('all')
  const [searchProject, setSearchProject] = useState('all')
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [projects, setProjects] = useState<{ id: number, name: string, project_number: string }[]>([])
  const [stats, setStats] = useState<StatResult[]>([])
  const [loading, setLoading] = useState(false)

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // 사용자 및 프로젝트 목록 로드
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadUsers()
      loadProjects()
    }
  }, [isAuthenticated, authLoading])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('사용자 로드 실패:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data || [])
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
    }
  }

  const searchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchStartDate) params.append('startDate', searchStartDate)
      if (searchEndDate) params.append('endDate', searchEndDate)
      if (searchUser !== 'all') params.append('userId', searchUser)
      if (searchWorkType !== 'all') params.append('workType', searchWorkType)
      if (searchWorkSubType !== 'all') params.append('workSubType', searchWorkSubType)
      if (searchProject !== 'all') params.append('projectId', searchProject)

      const response = await fetch(`/api/work-diary/stats?${params}`, {
        headers: {
          'x-user-level': String(user?.level || '1'),
          'x-user-id': user?.id || 'unknown'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('통계 API 응답:', data)
        console.log('통계 데이터:', data.stats)
        setStats(data.stats || [])
      } else if (response.status === 403) {
        alert('권한이 없습니다. Level 5 이상만 접근 가능합니다.')
        router.push('/work-diary')
      } else {
        // 에러 발생 시 빈 통계 표시
        console.error('통계 조회 실패:', response.status, response.statusText)
        setStats([])
        alert('통계 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('통계 검색 실패:', error)
      setStats([])
      alert('통계 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchStartDate('')
    setSearchEndDate('')
    setSearchUser('all')
    setSearchWorkType('all')
    setSearchWorkSubType('all')
    setSearchProject('all')
    setStats([])
  }

  const exportStats = () => {
    // 엑셀 내보내기 로직 (향후 구현)
    alert('엑셀 내보내기 기능이 구현되었습니다!')
  }

  return (
    <AuthGuard requiredLevel={4}>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
        {/* 헤더 (타이틀 제거, 엑셀 내보내기 버튼만 유지) */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={exportStats}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 내보내기
          </Button>
        </div>

          {/* 검색 필터 */}
          <Card className="mb-6 border border-gray-200 shadow-sm">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <Filter className="h-5 w-5 mr-2 text-gray-500" />
                검색 조건
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">시작 날짜</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={searchStartDate}
                      onChange={(e) => setSearchStartDate(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">종료 날짜</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={searchEndDate}
                      onChange={(e) => setSearchEndDate(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">사용자</Label>
                  <Select value={searchUser} onValueChange={setSearchUser}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체 사용자" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 사용자</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">작업 유형</Label>
                  <Select value={searchWorkType} onValueChange={setSearchWorkType}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 유형</SelectItem>
                      <SelectItem value="신규">신규</SelectItem>
                      <SelectItem value="보완">보완</SelectItem>
                      <SelectItem value="AS">AS</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                      <SelectItem value="OV">OV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">세부 유형</Label>
                  <Select value={searchWorkSubType} onValueChange={setSearchWorkSubType}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체 세부유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 세부유형</SelectItem>
                      <SelectItem value="내근">내근</SelectItem>
                      <SelectItem value="출장">출장</SelectItem>
                      <SelectItem value="외근">외근</SelectItem>
                      <SelectItem value="전화">전화</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">프로젝트</Label>
                  <Select value={searchProject} onValueChange={setSearchProject}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체 프로젝트" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 프로젝트</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={resetSearch}
                  className="text-gray-600"
                >
                  초기화
                </Button>
                <Button
                  onClick={searchStats}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      통계 검색
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 통계 결과 */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <BarChart3 className="h-5 w-5 mr-2 text-gray-500" />
                통계 결과 {stats.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({stats.length}개 카테고리)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">통계를 계산하고 있습니다...</p>
                </div>
              ) : stats.length > 0 ? (
                <div className="space-y-6">
                  {/* 전체 초과근무시간 합계 */}
                  {(() => {
                    const totalOvertimeHours = stats.reduce((total, stat) => {
                      if (stat.details && Array.isArray(stat.details)) {
                        return total + stat.details.reduce((sum, detail) => {
                          return sum + (detail.totalOvertimeHours || 0)
                        }, 0)
                      }
                      return total
                    }, 0)

                    if (totalOvertimeHours > 0) {
                      return (
                        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
                          <div className="flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600 mb-2">
                                총 초과근무시간: {Math.round(totalOvertimeHours * 10) / 10}시간
                              </div>
                              <div className="text-sm text-red-500">
                                모든 사용자의 초과근무시간 합계
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {stats.map((stat, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">
                          {stat.category}
                        </h3>
                        <div className={`text-xl font-bold ${stat.category === '초과근무 현황' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                          {stat.category === '초과근무 현황' ? `${stat.value}명` : stat.value}
                        </div>
                      </div>
                      
                      <div className="p-6 bg-white">
                        {stat.details && stat.details.length > 0 ? (
                          <div className="space-y-4">
                            {/* 표 형식으로 세부 내역 표시 */}
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                      {stat.category === '사용자별 업무 유형 통계' ? '사용자' :
                                        stat.category === '프로젝트별 작업량 분석' ? '프로젝트' :
                                          stat.category === '작업 유형별 분포' ? '작업 유형' :
                                            stat.category === '세부 유형별 분포' ? '세부 유형' :
                                              stat.category === '월별 업무 현황' ? '월' :
                                                stat.category === '주말/휴일 근무 현황' ? '사용자' :
                                                  stat.category === '초과근무 현황' ? '사용자' : '항목'}
                                    </th>
                                    {stat.category === '초과근무 현황' ? (
                                      <>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">총 초과근무시간</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">초과근무 일수</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">세부 내역</th>
                                      </>
                                    ) : (
                                      <>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">총 작업</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">출장</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">내근</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">외근</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">전화</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">근무시간</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">초과근무</th>
                                      </>
                                    )}
                                    {stat.category === '월별 업무 현황' && (
                                      <th className="px-4 py-3 text-center font-medium text-gray-500">사용자 수</th>
                                    )}
                                    {stat.category === '프로젝트별 작업량 분석' && (
                                      <th className="px-4 py-3 text-center font-medium text-gray-500">작업 유형</th>
                                    )}
                                    {stat.category === '주말/휴일 근무 현황' && (
                                      <th className="px-4 py-3 text-center font-medium text-gray-500">유형별 분포</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {stat.details.map((detail, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 font-medium text-gray-900">
                                        {detail.name || detail.user || detail.project || `항목 ${idx + 1}`}
                                      </td>
                                      {stat.category === '초과근무 현황' ? (
                                        <>
                                          <td className="px-4 py-3 text-center">
                                            <span className="font-bold text-red-600">{detail.totalOvertimeHours || 0}시간</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="font-medium text-orange-600">{detail.overtimeDays || 0}일</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <div className="space-y-1">
                                              {detail.details && detail.details.length > 0 ? (
                                                detail.details.slice(0, 3).map((overtimeDetail, detailIdx) => (
                                                  <div key={detailIdx} className="text-xs text-gray-500">
                                                    {overtimeDetail.date} {overtimeDetail.startTime}-{overtimeDetail.endTime} ({overtimeDetail.overtimeHours}h)
                                                  </div>
                                                ))
                                              ) : (
                                                <span className="text-gray-400">-</span>
                                              )}
                                              {detail.details && detail.details.length > 3 && (
                                                <div className="text-xs text-gray-400">+{detail.details.length - 3}건 더</div>
                                              )}
                                            </div>
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td className="px-4 py-3 text-center text-gray-600">
                                            {detail.total || detail.count || 0}회
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-gray-600">{detail.출장 || 0}</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-gray-600">{detail.내근 || 0}</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-gray-600">{detail.외근 || 0}</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-gray-600">{detail.전화 || 0}</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-blue-600 font-medium">{detail.totalWorkHours || 0}h</span>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-red-600 font-medium">{detail.totalOvertimeHours || 0}h</span>
                                          </td>
                                        </>
                                      )}
                                      {stat.category === '월별 업무 현황' && (
                                        <td className="px-4 py-3 text-center text-gray-600">
                                          {detail.users || 0}명
                                        </td>
                                      )}
                                      {stat.category === '프로젝트별 작업량 분석' && (
                                        <td className="px-4 py-3 text-center text-gray-600">
                                          {detail.workTypes ? Object.keys(detail.workTypes).length : 0}종류
                                        </td>
                                      )}
                                      {stat.category === '주말/휴일 근무 현황' && (
                                        <td className="px-4 py-3 text-center text-gray-600">
                                          {detail.types ? Object.keys(detail.types).length : 0}종류
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* 추가 세부 정보 (작업 유형, 세부 유형 등) */}
                            {stat.details.some(detail => detail.workTypes && Object.keys(detail.workTypes).length > 0) && (
                              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-2">작업 유형별 상세 분포</div>
                                <div className="flex flex-wrap gap-2">
                                  {stat.details.map((detail, idx) =>
                                    detail.workTypes && Object.entries(detail.workTypes).map(([type, count]) => (
                                      <span key={`${idx}-${type}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800">
                                        {detail.name}: {type} ({count})
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic text-center py-4">상세 데이터가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">통계 데이터 없음</h3>
                  <p className="text-gray-500 mb-6">
                    검색 조건에 맞는 데이터가 없습니다.<br />
                    다른 조건으로 검색해보세요.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <Users className="h-4 w-4 mr-2" />
                      사용자별 출장/내근 통계
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <Calendar className="h-4 w-4 mr-2" />
                      주말/휴일 근무 현황
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <Briefcase className="h-4 w-4 mr-2" />
                      프로젝트별 작업량 분석
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      작업 유형별 분포
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      세부 유형별 분포
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <Clock className="h-4 w-4 mr-2" />
                      월별 업무 현황
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AuthGuard>
  )
}
