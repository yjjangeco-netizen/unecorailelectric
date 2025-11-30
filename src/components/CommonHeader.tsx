'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  User as UserIcon, 
  Settings, 
  Home,
  Calendar,
  BarChart3,
  Users,
  Package2,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/types'

interface CustomButton {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
  className?: string
}

interface CommonHeaderProps {
  currentUser: { id: string; name: string; level: string; [key: string]: any } | null
  isAdmin: boolean
  onShowUserManagement?: () => void
  onLogout?: () => void
  onShowLoginModal?: () => void
  title?: string
  backUrl?: string
  customButtons?: CustomButton[]
  showUserSpecificMenus?: boolean
}

export default function CommonHeader({
  currentUser,
  isAdmin,
  onShowUserManagement: _onShowUserManagement,
  onLogout,
  onShowLoginModal,
  title = "유네코레일 전기팀 자재관리 시스템",
  backUrl: _backUrl,
  customButtons = [],
  showUserSpecificMenus = false
}: CommonHeaderProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('user')
      router.push('/')
    }
  }

  const handleShowLoginModal = () => {
    if (onShowLoginModal) {
      onShowLoginModal()
    } else {
      router.push('/')
    }
  }

  // 기본 네비게이션 아이템
  const allNavigationItems = [
    { name: '대시보드', href: '/dashboard', icon: Home, key: 'dashboard' },
    { name: '재고관리', href: '/stock-management', icon: Package2, key: 'stock_view' },
    { name: '업무일지', href: '/work-diary', icon: FileText, key: 'daily_log' },
    { name: '일정관리', href: '/schedule', icon: Calendar, key: 'schedule' },
    { name: '업무도구', href: '/work-tool', icon: Settings, key: 'work_tools' },
    { name: 'SOP', href: '/sop', icon: FileText, key: 'sop' },
    { name: 'Nara', href: '/nara-monitoring', icon: BarChart3, key: 'nara' },
    { name: '설정', href: '/settings', icon: Users, key: 'settings' },
  ]

  // 사용자별 메뉴 필터링 (레벨 기반)
  const getFilteredNavigationItems = () => {
    if (!currentUser) {
      return allNavigationItems
    }

    const userLevel = currentUser.level || '1'
    const isLevel1 = userLevel === '1'
    const isLevel2 = userLevel === '2'
    const isLevel3 = userLevel === '3'
    const isLevel4 = userLevel === '4'
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel?.toLowerCase() === 'administrator'

    return allNavigationItems.filter(item => {
      // 관리자는 모든 메뉴 접근 가능
      if (isAdmin) return true
      
      // 레벨별 권한에 따라 필터링
      switch (item.key) {
        case 'dashboard':
          return true // Level 1 이상
        case 'stock_view':
          return isLevel1 || isLevel2 || isLevel3 || isLevel4 || isLevel5 // Level 1 이상 (읽기만)
        case 'daily_log':
          return isLevel2 || isLevel3 || isLevel4 || isLevel5 // Level 2 이상 (작성/조회)
        case 'schedule':
          return isLevel3 || isLevel4 || isLevel5 // Level 3 이상
        case 'work_tools':
          return isLevel3 || isLevel4 || isLevel5 // Level 3 이상
        case 'sop':
          return isLevel3 || isLevel4 || isLevel5 // Level 3 이상
        case 'nara':
          return isLevel4 || isLevel5 // Level 4 이상
        case 'settings':
          return isLevel5 // Level 5 이상
        default:
          return false
      }
    })
  }

  const navigationItems = getFilteredNavigationItems()

  return (
    <>
      {/* 상단 바 */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-3 text-center">
            <h1 className="text-2xl font-bold text-gray-800">유네코 레일 전기파트 업무 시스템</h1>
          </div>
        </div>
      </div>
      
      {/* 메인 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* 왼쪽: 로고 및 제목 */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-xl p-2">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-500 text-sm">통합 관리 시스템</p>
            </div>
          </div>

          {/* 오른쪽: 사용자 정보 및 로그아웃 */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* 사용자 정보 */}
                <div className="text-right">
                  <p className="text-gray-900 font-medium text-sm">{currentUser.name}</p>
                  <p className="text-gray-500 text-xs">Level {currentUser.level}</p>
                </div>
                
                {/* 로그아웃 버튼 */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-3 py-2 flex items-center space-x-2 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">로그아웃</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleShowLoginModal}
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-6 py-2 rounded-xl transition-all duration-200 shadow-sm"
              >
                로그인
              </Button>
            )}

            {/* 모바일 메뉴 버튼 */}
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden bg-gray-100 hover:bg-gray-200 text-gray-600 border-0 rounded-xl p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* 모바일 네비게이션 (필요시 사이드바 토글로 변경 가능, 일단 유지하되 스타일 변경) */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                
                // 설정 메뉴인 경우 서브메뉴 처리
                if (item.key === 'settings') {
                  return (
                    <div key={item.name}>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          // 설정 페이지로 이동하면서 서브메뉴 토글
                          if (!isSettingsOpen) {
                            router.push(item.href)
                          }
                          setIsSettingsOpen(!isSettingsOpen)
                        }}
                        className="w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 justify-start"
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        <svg
                          className={`ml-auto h-4 w-4 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                      
                      {/* 설정 서브메뉴 */}
                      {isSettingsOpen && (
                        <div className="ml-8 mt-2 space-y-1">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              router.push('/user-management')
                              setIsMenuOpen(false)
                              setIsSettingsOpen(false)
                            }}
                            className="w-full text-gray-500 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-3 justify-start text-sm"
                          >
                            <Users className="h-4 w-4" />
                            <span>회원관리</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              router.push('/project-management')
                              setIsMenuOpen(false)
                              setIsSettingsOpen(false)
                            }}
                            className="w-full text-gray-500 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-3 justify-start text-sm"
                          >
                            <Package className="h-4 w-4" />
                            <span>프로젝트 관리</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              router.push('/nara-settings')
                              setIsMenuOpen(false)
                              setIsSettingsOpen(false)
                            }}
                            className="w-full text-gray-500 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-3 justify-start text-sm"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>입찰모니터링 관리</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                }
                
                // 일반 메뉴 아이템
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => {
                      router.push(item.href)
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 justify-start"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Button>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  )
}
