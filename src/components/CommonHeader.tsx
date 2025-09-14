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
    { name: '업무일지', href: '/work-diary', icon: Calendar, key: 'daily_log' },
    { name: '업무도구', href: '/work-tool', icon: Settings, key: 'work_tools' },
    { name: 'SOP', href: '/sop', icon: FileText, key: 'sop' },
    { name: 'Nara', href: '/nara-monitoring', icon: BarChart3, key: 'nara' },
    { name: '설정', href: '/settings', icon: Users, key: 'settings' },
  ]

  // 사용자별 메뉴 필터링
  const getFilteredNavigationItems = () => {
    if (!showUserSpecificMenus || !currentUser) {
      return allNavigationItems
    }

    return allNavigationItems.filter(item => {
      // 관리자는 모든 메뉴 접근 가능
      if (isAdmin) return true
      
      // 사용자별 권한에 따라 필터링
      switch (item.key) {
        case 'dashboard':
          return true // 대시보드는 항상 표시
        case 'stock_view':
          return currentUser['stock_view'] === true
        case 'daily_log':
          return currentUser['daily_log'] === true
        case 'work_tools':
          return currentUser['work_tools'] === true
        case 'sop':
          return currentUser['sop'] === true
        case 'nara':
          return true // Nara는 항상 표시
        case 'settings':
          return currentUser['user_management'] === true || isAdmin
        default:
          return true
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
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* 왼쪽: 로고, 제목, 네비게이션 메뉴 */}
          <div className="flex items-center space-x-16">
            {/* 로고 및 제목 */}
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <p className="text-blue-100 text-sm">통합 관리 시스템</p>
              </div>
            </div>

            {/* 네비게이션 메뉴 */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => router.push(item.href)}
                    className="text-white hover:bg-white/20 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 text-lg font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                )
              })}
              
              {/* 커스텀 버튼들 */}
              {customButtons.map((button, index) => {
                const Icon = button.icon
                return (
                  <Button
                    key={`custom-${index}`}
                    variant={button.variant || "ghost"}
                    onClick={button.onClick}
                    className={`text-white hover:bg-white/20 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 text-lg font-medium ${button.className || ''}`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{button.label}</span>
                  </Button>
                )
              })}
            </nav>
          </div>

          {/* 오른쪽: 사용자 정보 및 로그아웃 */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* 사용자 정보 */}
                <div className="text-right">
                  <p className="text-white font-medium text-sm">{currentUser.name}</p>
                  <p className="text-blue-100 text-xs">Level {currentUser.level}</p>
                </div>
                
                {/* 로그아웃 버튼 */}
                <Button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">로그아웃</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleShowLoginModal}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                로그인
              </Button>
            )}

            {/* 모바일 메뉴 버튼 */}
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-white/20 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => {
                      router.push(item.href)
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-white hover:bg-white/20 hover:text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 justify-start"
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
