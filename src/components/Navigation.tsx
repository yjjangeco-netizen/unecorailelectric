'use client'

import { Building2, Package, Wrench, Calendar, FileText, Users, LogOut, BarChart3, Plus, Minus, Search, Settings, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export function Navigation() {
  const { user, logout, hasPermission, canAccessFeature } = useUser()
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  if (!user) return null

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // 사용자 레벨 확인
  const userLevel = user.level || '1'
  const isLevel1 = userLevel === '1'
  
  const handleLogout = () => {
    logout()
    // 로그아웃 후 홈페이지로 리다이렉트 (Next.js 라우터 사용)
    router.push('/')
  }
  
  // LEVEL1 사용자는 안내문구와 로그아웃 버튼만 표시
  if (isLevel1) {
    return (
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 및 브랜드 */}
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/dashboard')}
            >
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">유네코레일</h1>
                <p className="text-xs text-gray-600 leading-tight">전기파트 업무 시스템</p>
              </div>
            </div>

            {/* LEVEL1 사용자 안내문구 */}
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">
                  접근 권한이 없습니다
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  관리자에게 문의하세요
                </p>
              </div>
            </div>

            {/* 사용자 정보 및 로그아웃 */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.department || '전기팀'}·{user.position || '사원'} (Level {userLevel})
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const isLevel2 = userLevel === '2'
  const isLevel3 = userLevel === '3'
  const isLevel4 = userLevel === '4'
  const isLevel5 = userLevel === '5'
  const isAdmin = userLevel === 'administrator'

  const navigationItems = [
    {
      name: '전체 재고 현황',
      href: '/stock-management',
      icon: Package,
      description: '재고 조회',
      requiredLevel: '2', // Level2 이상
      show: isLevel2 || isLevel3 || isLevel4 || isLevel5 || isAdmin
    },
    {
      name: '업무 도구',
      href: '/work-tool',
      icon: Wrench,
      description: '업무 관련 도구',
      requiredLevel: '5', // Level5 이상
      show: isLevel5 || isAdmin
    },
    {
      name: '일일 업무일지',
      href: '/work-diary',
      icon: Calendar,
      description: '일일 업무 기록',
      requiredLevel: '3', // Level3 이상
      show: isLevel3 || isLevel4 || isLevel5 || isAdmin
    },
    {
      name: 'SOP',
      href: '/sop',
      icon: FileText,
      description: '표준 작업 절차',
      requiredLevel: '5', // Level5 이상
      show: isLevel5 || isAdmin
    },
    {
      name: '일정',
      href: '/schedule',
      icon: Calendar,
      description: '업무 일정 관리',
      requiredLevel: '3', // Level3 이상
      show: isLevel3 || isLevel4 || isLevel5 || isAdmin
    },
    {
      name: 'Nara 모니터링',
      href: '/nara-monitoring',
      icon: Search,
      description: '입찰공고 모니터링',
      requiredLevel: '3', // Level3 이상
      show: isLevel3 || isLevel4 || isLevel5 || isAdmin
    },
    {
      name: '사용자 관리 및 설정',
      href: '/user-management-settings',
      icon: Users,
      description: '사용자 및 프로젝트 관리',
      requiredLevel: '5', // Level5 이상
      show: isLevel5 || isAdmin
    }
  ]



  return (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 브랜드 */}
          <div 
            className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/dashboard')}
          >
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">유네코레일</h1>
              <p className="text-xs text-gray-600 leading-tight">전기파트 업무 시스템</p>
            </div>
          </div>

          {/* 네비게이션 메뉴 - 왼쪽 정렬 */}
          <div className="flex-1 flex justify-start ml-8">
            <div className="flex flex-wrap gap-2 items-center">
              {navigationItems
                .filter(item => item.show) // 레벨에 따라 필터링
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Card 
                      key={item.href}
                      className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300 min-w-[100px] bg-blue-50 hover:bg-blue-100"
                      onClick={() => router.push(item.href)}
                    >
                      <CardContent className="p-2">
                        <div className="flex flex-col items-center space-y-1 text-center">
                          <div className="p-1 bg-blue-200 rounded">
                            <Icon className="h-4 w-4 text-blue-700" />
                          </div>
                          <div>
                            <h3 className={`font-semibold text-gray-800 ${item.name === '전체 재고 현황' || item.name === '사용자 관리 및 설정' ? 'text-sm' : 'text-xs'}`}>
                              {item.name}
                            </h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>


          </div>

          {/* 사용자 정보 및 설정 */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.department || '전기팀'}·{user.position || '사원'} (Level {userLevel})
              </p>
            </div>
            
            {/* 설정 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>설정</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {/* 드롭다운 메뉴 */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push('/user-management')
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Users className="h-4 w-4 mr-3" />
                      회원 관리
                    </button>
                    <button
                      onClick={() => {
                        router.push('/project-management')
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      프로젝트 관리
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
