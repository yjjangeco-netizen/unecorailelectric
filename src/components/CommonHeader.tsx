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
  ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/types'

interface CommonHeaderProps {
  currentUser: { id: string; name: string; level: string } | null
  isAdmin: boolean
  onShowUserManagement?: () => void
  onLogout?: () => void
  onShowLoginModal?: () => void
  title?: string
  backUrl?: string
}

export default function CommonHeader({
  currentUser,
  isAdmin,
  onShowUserManagement,
  onLogout,
  onShowLoginModal,
  title = "유네코레일 전기팀 자재관리 시스템",
  backUrl = "/" // 사용되지 않는 매개변수
}: CommonHeaderProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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

  const navigationItems = [
    { name: '대시보드', href: '/dashboard', icon: Home },
    { name: '일정관리', href: '/schedule', icon: Calendar },
    { name: '재고관리', href: '/stock-management', icon: Package2 },
    { name: '업무일지', href: '/work-diary', icon: FileText },
    { name: '회원관리', href: '/user-management', icon: Users },
  ]

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* 로고 및 제목 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <p className="text-blue-100 text-sm">통합 관리 시스템</p>
              </div>
            </div>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => router.push(item.href)}
                  className="text-white hover:bg-white/20 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              )
            })}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <Button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:block">{currentUser.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* 사용자 드롭다운 메뉴 */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">레벨 {currentUser.level}</p>
                    </div>
                    {isAdmin && onShowUserManagement && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          onShowUserManagement()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full justify-start text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        관리자 설정
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleLogout()
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full justify-start text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </Button>
                  </div>
                )}
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
  )
}
