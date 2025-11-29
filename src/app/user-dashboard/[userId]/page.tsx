'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import CommonHeader from '@/components/CommonHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Home,
  Package2,
  Calendar,
  Settings,
  FileText,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import type { User } from '@/lib/types'

export default function UserDashboardPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const userId = params['userId'] as string

  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('사용자 대시보드 - 사용자 상태:', { currentUser, isAuthenticated, authLoading })

    // localStorage에서 직접 사용자 정보 확인
    const storedUser = localStorage.getItem('user')
    console.log('사용자 대시보드 - localStorage 직접 확인:', storedUser)

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        console.log('사용자 대시보드 - localStorage 사용자 데이터:', userData)
        // localStorage에 사용자 정보가 있으면 페이지 표시
        if (userData && userData.id && userData.username) {
          console.log('사용자 대시보드 - localStorage 기반 인증 확인, 페이지 표시')
          loadTargetUser()
          return
        }
      } catch (err) {
        console.error('localStorage 파싱 오류:', err)
      }
    }

    // 로딩이 완료되고 인증되지 않은 경우에만 리다이렉트
    if (!authLoading && !isAuthenticated && !storedUser) {
      console.log('사용자 대시보드 - 로그인 페이지로 리다이렉트')
      router.push('/login')
    } else if (isAuthenticated) {
      console.log('사용자 대시보드 - 인증된 사용자, 페이지 표시')
      loadTargetUser()
    }
  }, [authLoading, isAuthenticated, router, userId])

  const loadTargetUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users?id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setTargetUser(data.user)
      } else {
        setError('사용자 정보를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('사용자 정보 로드 오류:', err)
      setError('사용자 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <CommonHeader
          currentUser={currentUser ? { ...currentUser, level: String(currentUser.level) } : null}
          isAdmin={currentUser?.level === 'admin'}
          title="사용자 대시보드"
          backUrl="/user-management"
          onLogout={() => router.push('/login')}
        />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-white">
        <CommonHeader
          currentUser={currentUser ? { ...currentUser, level: String(currentUser.level) } : null}
          isAdmin={currentUser?.level === 'admin'}
          title="사용자 대시보드"
          backUrl="/user-management"
          onLogout={() => router.push('/login')}
        />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              사용자 정보를 찾을 수 없습니다.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // 사용자별 메뉴 권한 확인
  const getUserMenuPermissions = () => {
    return {
      stock_view: targetUser.stock_view || false,
      stock_in: targetUser.stock_in || false,
      stock_out: targetUser.stock_out || false,
      stock_disposal: targetUser.stock_disposal || false,
      work_tools: targetUser.work_tools || false,
      daily_log: targetUser.daily_log || false,
      work_manual: targetUser.work_manual || false,
      sop: targetUser.sop || false,
      user_management: targetUser.user_management || false,
    }
  }

  const permissions = getUserMenuPermissions()

  return (
    <div className="min-h-screen bg-white">
      <CommonHeader
        currentUser={targetUser ? { ...targetUser, level: String(targetUser.level) } : null}
        isAdmin={targetUser?.level === 'admin'}
        title={`${targetUser.name}님의 대시보드`}
        backUrl="/user-management"
        onLogout={() => router.push('/login')}
        showUserSpecificMenus={true}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 사용자 정보 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              사용자 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">이름</p>
                <p className="font-medium">{targetUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">부서</p>
                <p className="font-medium">{targetUser.department || '미지정'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">직급</p>
                <p className="font-medium">{targetUser.position || '미지정'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메뉴 권한 현황 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              메뉴 권한 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(permissions).map(([key, hasPermission]) => {
                const menuNames: { [key: string]: string } = {
                  stock_view: '재고 조회',
                  stock_in: '재고 입고',
                  stock_out: '재고 출고',
                  stock_disposal: '재고 폐기',
                  work_tools: '업무도구',
                  daily_log: '업무일지',
                  work_manual: '메뉴얼 관리',
                  sop: 'SOP',
                  user_management: '회원관리',
                }

                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">{menuNames[key]}</span>
                    {hasPermission ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 안내 메시지 */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            위의 권한에 따라 상단 메뉴에서 접근 가능한 기능이 제한됩니다.
            관리자에게 권한 변경을 요청하세요.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
