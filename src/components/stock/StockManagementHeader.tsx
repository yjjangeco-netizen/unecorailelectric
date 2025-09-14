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
  currentUser: _currentUser,
  isAdmin: _isAdmin,
  onShowUserManagement: _onShowUserManagement,
  onLogout: _onLogout,
  onShowLoginModal: _onShowLoginModal
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
            
            
          </div>
        </div>
      </div>
    </header>
  )
}
