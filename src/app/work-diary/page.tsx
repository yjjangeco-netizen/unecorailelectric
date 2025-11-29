'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CommonHeader from '@/components/CommonHeader'
import {
  FileText,
  Search,
  Calendar,
  Clock,
  Users,
  BarChart3,
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

export default function WorkDiaryPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [recentDiaries, setRecentDiaries] = useState<WorkDiaryEntry[]>([])
  const [businessTripReports, setBusinessTripReports] = useState<BusinessTripReport[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)

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
      console.log('현재 사용자 정보:', user)
      console.log('사용자 레벨:', userLevel)
      console.log('Level 5 체크:', userLevel === '5')
      console.log('Administrator 체크:', userLevel === 'administrator')
      // Level 1 사용자도 업무일지 접근 가능하도록 수정
      // if (userLevel === '1') {
      //   router.push('/dashboard')
      // }
    }
  }, [authLoading, isAuthenticated, user, router])

  // 최근 업무일지 데이터 로드
  useEffect(() => {
    const loadRecentDiaries = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/work-diary?limit=5')
        if (response.ok) {
          const result = await response.json()
          setRecentDiaries(result.data || [])
        }
      } catch (error) {
        console.error('최근 업무일지 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user) {
      loadRecentDiaries()
    }
  }, [isAuthenticated, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
    <AuthGuard requiredLevel={2}>
      <div className="min-h-screen bg-white">
        {/* 공통 헤더 */}
        <CommonHeader
          currentUser={user ? { ...user, level: String(user.level) } : null}
          isAdmin={user?.level === 'admin'}
          title="업무일지"
          backUrl="/"
          onLogout={() => router.push('/login')}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">일일 업무일지</h1>
            <p className="text-gray-600">업무 내용 작성 및 조회</p>
          </div>

          {/* 카드 선택 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 업무일지 작성 카드 */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50"
              onClick={() => router.push('/work-diary/write')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-orange-800">업무일지 작성</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-orange-700 mb-6">
                  일일 업무 내용을 작성하고 등록합니다.
                </p>
                <div className="space-y-2 text-sm text-orange-600">
                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    날짜별 업무 기록
                  </div>
                  <div className="flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    프로젝트별 분류
                  </div>
                  <div className="flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2" />
                    상세 업무 내용
                  </div>
                </div>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/work-diary/write')
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  작성하기
                </Button>
              </CardContent>
            </Card>

            {/* 업무일지 조회 카드 */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50"
              onClick={() => router.push('/work-diary/view')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <Search className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl text-emerald-800">업무일지 조회</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-emerald-700 mb-6">
                  작성된 업무일지를 검색하고 조회합니다.
                </p>
                <div className="space-y-2 text-sm text-emerald-600">
                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    기간별 조회
                  </div>
                  <div className="flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2" />
                    작성자별 필터
                  </div>
                  <div className="flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    통계 및 분석
                  </div>
                </div>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/work-diary/view')
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  조회하기
                </Button>
              </CardContent>
            </Card>

            {/* 통계 대시보드 카드 - Level 5 이상만 표시 */}
            {(user?.level === '5' || user?.level === 'administrator') && (
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50"
                onClick={() => router.push('/work-diary/stats')}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                    <BarChart3 className="h-8 w-8 text-violet-600" />
                  </div>
                  <CardTitle className="text-xl text-violet-800">업무 통계</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-violet-700 mb-6">
                    업무 현황을 한눈에 확인합니다.
                  </p>
                  <div className="space-y-2 text-sm text-violet-600">
                    <div className="flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      월별 업무 현황
                    </div>
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 mr-2" />
                      팀별 업무 분포
                    </div>
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-2" />
                      업무 시간 분석
                    </div>
                  </div>
                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-md"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push('/work-diary/stats')
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    통계 보기
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 고급 통계 검색 카드 - 임시로 모든 사용자에게 표시 */}
            {true && (
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50"
                onClick={() => router.push('/work-diary/advanced-stats')}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                    <Search className="h-8 w-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl text-amber-800">고급 통계 검색</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-amber-700 mb-6">
                    다양한 조건으로 업무 통계를 검색합니다.
                  </p>
                  <div className="space-y-2 text-sm text-amber-600">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 mr-2" />
                      사용자별 출장/내근 통계
                    </div>
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      주말/휴일 근무 현황
                    </div>
                    <div className="flex items-center justify-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      프로젝트별 작업량 분석
                    </div>
                  </div>
                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push('/work-diary/advanced-stats')
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    고급 검색
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 출장/외근 보고 카드 */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50"
              onClick={() => router.push('/business-trip-reports')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-800">출장/외근 보고</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-700 mb-6">
                  출장/외근 보고서를 조회하고 관리합니다.
                </p>
                <div className="space-y-2 text-sm text-blue-600">
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    출장/외근 현황
                  </div>
                  <div className="flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    보고서 조회
                  </div>
                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    기간별 필터
                  </div>
                </div>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/business-trip-reports')
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  보고서 보기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 최근 업무일지 미리보기 */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">최근 업무일지</h2>
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200">
              <CardContent className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">최근 업무일지를 불러오는 중...</p>
                  </div>
                ) : recentDiaries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                      <FileText className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">최근 업무일지가 없습니다</h3>
                    <p className="text-gray-600 mb-6">
                      업무일지를 작성하면 여기에 최근 기록이 표시됩니다.
                    </p>
                    <Button
                      onClick={() => router.push('/work-diary/write')}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-md"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      첫 업무일지 작성하기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        최근 {recentDiaries.length}개의 업무일지
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/work-diary/view')}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        전체 보기
                      </Button>
                    </div>
                    {recentDiaries.map((diary) => (
                      <div key={diary.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {diary.project?.project_name || '프로젝트 없음'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {diary.project?.project_number || 'N/A'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(diary.workDate)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {diary.workContent}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          작성자: {diary.user?.name || diary.userId || '알 수 없음'}
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => router.push('/work-diary/write')}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-md"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        새 업무일지 작성하기
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}