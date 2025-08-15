'use client'

import { Button } from '@/components/ui/button'
import { Package, ArrowLeft, User, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StockManagementHeaderProps {
  currentUser: { username: string; name: string; role: string } | null
  isAdmin: boolean
  onShowUserManagement: () => void
  onLogout: () => void
  onShowLoginModal: () => void
}

export default function StockManagementHeader({
  currentUser,
  isAdmin,
  onShowUserManagement,
  onLogout,
  onShowLoginModal
}: StockManagementHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">유네코레일 전기팀 자재관리 시스템</h1>
          </div>
          
          {/* 우측: 로그인/사용자 정보 및 메인으로 돌아가기 */}
          <div className="flex items-center space-x-4">
            {/* 메인으로 돌아가기 버튼 */}
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>메인으로</span>
            </Button>
            
            {/* 로그인/사용자 정보 */}
            {currentUser ? (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">
                  {currentUser.name}님 반갑습니다. ({currentUser.role})
                </span>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={onShowUserManagement}
                    variant="outline"
                    className="ml-2 px-2 py-1 text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    회원관리
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onLogout}
                  variant="outline"
                  className="px-2 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <Button
                  size="sm"
                  onClick={onShowLoginModal}
                  variant="outline"
                  className="px-3 py-2 text-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                >
                  <User className="h-4 w-4 mr-1" />
                  로그인
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
