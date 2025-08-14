'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileText, Package, BookOpen, LogOut, User } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  path: string
  roles: string[]
}

function WorkToolContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userRole, setUserRole] = useState<string>('user')
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    const role = searchParams.get('role') || 'user'
    const user = searchParams.get('user') || '사용자'
    setUserRole(role)
    setUsername(user)
  }, [searchParams])

  // 메뉴 항목 정의
  const menuItems: MenuItem[] = [
    {
      id: 'manual',
      name: '메뉴얼 관리',
      description: '업무 매뉴얼 및 가이드 문서 관리',
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      path: '/manual-management',
      roles: ['admin', 'manager'] // 관리자와 매니저만 접근 가능
    },
    {
      id: 'stock',
      name: '재고 관리',
      description: '전체 재고 현황 및 입출고 관리',
      icon: <Package className="h-8 w-8 text-green-600" />,
      path: '/stock-management',
      roles: ['admin', 'manager', 'user'] // 모든 사용자 접근 가능
    },
    {
      id: 'sop',
      name: 'SOP',
      description: '표준 작업 절차 및 프로세스 관리',
      icon: <BookOpen className="h-8 w-8 text-purple-600" />,
      path: '/stock-management', // SOP 버튼도 재고관리로 이동
      roles: ['admin', 'manager'] // 관리자와 매니저만 접근 가능
    }
  ]

  // 사용자 역할에 따른 메뉴 필터링
  const accessibleMenus = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  // 메뉴 클릭 처리
  const handleMenuClick = (path: string) => {
    router.push(path)
  }

  // 로그아웃 처리
  const handleLogout = () => {
    router.push('/')
  }

  // 역할별 표시명
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자'
      case 'manager': return '매니저'
      case 'user': return '일반 사용자'
      default: return '사용자'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">유네코레일 전기파트</h1>
                <p className="text-xs sm:text-sm text-gray-600">업무 관리 시스템</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-gray-900">{username}님</p>
                <p className="text-xs text-gray-600">({getRoleDisplayName(userRole)})</p>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">업무 도구</h2>
          <p className="text-sm sm:text-lg text-gray-600">
            {username}님의 권한에 맞는 업무 도구를 선택하세요
          </p>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {accessibleMenus.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => handleMenuClick(item.path)}
            >
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-3">
                  {item.icon}
                </div>
                <CardTitle className="text-lg sm:text-xl text-gray-900">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 접근 불가 메뉴 안내 */}
        {accessibleMenus.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <User className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">접근 가능한 메뉴가 없습니다</h3>
              <p className="text-sm text-yellow-700">
                현재 권한으로는 접근할 수 있는 업무 도구가 없습니다.
                <br />
                관리자에게 권한 요청을 해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 권한 정보 */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
              🔐 현재 권한 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <strong>사용자:</strong> {username}
              </div>
              <div>
                <strong>권한:</strong> {getRoleDisplayName(userRole)}
              </div>
              <div>
                <strong>접근 가능 메뉴:</strong> {accessibleMenus.length}개
              </div>
              <div>
                <strong>전체 메뉴:</strong> {menuItems.length}개
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WorkToolPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkToolContent />
    </Suspense>
  )
} 