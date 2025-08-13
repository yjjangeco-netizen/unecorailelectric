'use client'

import { useState, useEffect } from 'react'
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

export default function WorkToolPage() {
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">유네코레일 전기파트</h1>
                <p className="text-sm text-gray-600">업무 관리 시스템</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{username}님</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">업무툴</h2>
          <p className="text-lg text-gray-600">
            {username}님의 권한에 맞는 메뉴를 선택하세요
          </p>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleMenus.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-2 hover:border-blue-300"
              onClick={() => handleMenuClick(item.path)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  {item.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">{item.description}</p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {item.name} 바로가기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 접근 불가 메뉴 안내 */}
        {accessibleMenus.length < menuItems.length && (
          <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                추가 메뉴 접근 안내
              </h3>
              <p className="text-sm text-yellow-700">
                현재 {getRoleDisplayName(userRole)} 권한으로는 일부 메뉴에만 접근할 수 있습니다.
                <br />
                추가 메뉴 접근이 필요하시면 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        )}

        {/* 권한별 메뉴 정보 */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            권한별 메뉴 접근 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <h4 className="font-medium text-gray-800 mb-2">일반 사용자</h4>
              <p className="text-gray-600">재고 관리</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-gray-800 mb-2">매니저</h4>
              <p className="text-gray-600">재고 관리, 메뉴얼 관리, SOP</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-gray-800 mb-2">관리자</h4>
              <p className="text-gray-600">모든 메뉴 접근 가능</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 