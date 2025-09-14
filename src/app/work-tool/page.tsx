'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CommonHeader from '@/components/CommonHeader'
import { 
  Calculator, 
  FileText, 
  BarChart3,
  Settings,
  Wrench,
  Zap
} from 'lucide-react'

export default function WorkToolPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Level5 이상 권한 확인 (레벨 4 이하는 준비중 메시지)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('업무도구 페이지 사용자 정보:', user)
      const userLevel = user.level || '1'
      const levelNum = parseInt(userLevel)
      if (levelNum < 5 && userLevel !== 'administrator') {
        // 레벨 4 이하는 준비중 메시지 표시
        return
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 레벨 4 이하 사용자는 준비중 메시지 표시
  const userLevel = user?.level || '1'
  const levelNum = parseInt(userLevel)
  if (levelNum < 5 && userLevel !== 'administrator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">업무 도구</h1>
            <p className="text-gray-600 mb-6">
              현재 페이지 준비 중입니다.<br />
              Level 5 이상 사용자만 이용 가능합니다.
            </p>
            <div className="text-sm text-gray-500">
              현재 권한: Level {userLevel}
            </div>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              대시보드로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 공통 헤더 */}
      <CommonHeader
        currentUser={user}
        isAdmin={user?.level === 'admin'}
        title="업무도구"
        backUrl="/"
        onLogout={() => router.push('/login')}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">업무 도구</h1>
          <p className="text-gray-600 mt-2">
            업무 효율성을 높이는 다양한 도구들을 제공합니다.
          </p>
        </div>

        {/* 업무 도구 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 계산기 도구 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">계산기 도구</CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">계산</div>
              <p className="text-xs text-muted-foreground">
                전기 계산 및 변환 도구
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => alert('계산기 도구 개발 예정')}
              >
                <Calculator className="h-4 w-4 mr-2" />
                사용하기
              </Button>
            </CardContent>
          </Card>

          {/* 문서 생성기 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">문서 생성기</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">문서</div>
              <p className="text-xs text-muted-foreground">
                업무 보고서 및 문서 생성
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => alert('문서 생성기 개발 예정')}
              >
                <FileText className="h-4 w-4 mr-2" />
                생성하기
              </Button>
            </CardContent>
          </Card>

          {/* 데이터 분석 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">데이터 분석</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">분석</div>
              <p className="text-xs text-muted-foreground">
                업무 데이터 분석 및 시각화
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => alert('데이터 분석 도구 개발 예정')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                분석하기
              </Button>
            </CardContent>
          </Card>

          {/* 설정 도구 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">설정 도구</CardTitle>
              <Settings className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">설정</div>
              <p className="text-xs text-muted-foreground">
                시스템 및 업무 환경 설정
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => alert('설정 도구 개발 예정')}
              >
                <Settings className="h-4 w-4 mr-2" />
                설정하기
              </Button>
            </CardContent>
          </Card>

          {/* 유틸리티 도구 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">유틸리티 도구</CardTitle>
              <Wrench className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">유틸</div>
              <p className="text-xs text-muted-foreground">
                다양한 유틸리티 기능
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => alert('유틸리티 도구 개발 예정')}
              >
                <Wrench className="h-4 w-4 mr-2" />
                사용하기
              </Button>
            </CardContent>
          </Card>

          {/* 고급 도구 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">고급 도구</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">고급</div>
              <p className="text-xs text-muted-foreground">
                전문가용 고급 기능
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => alert('고급 도구 개발 예정')}
              >
                <Zap className="h-4 w-4 mr-2" />
                사용하기
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* 권한 안내 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">업무 도구 접근 권한</h3>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• Level 3 이상: 업무 도구 접근 가능</p>
            <p>• Level 1-2: 재고 조회만 가능 (업무 도구 접근 불가)</p>
            <p>• 각 도구는 개발 진행 중이며, 향후 기능이 추가될 예정입니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 