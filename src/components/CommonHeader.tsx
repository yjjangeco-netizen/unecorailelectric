'use client'

import { Button } from '@/components/ui/button'
import { Package, ArrowLeft, User as UserIcon, Settings } from 'lucide-react'
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
  currentUser: _currentUser,
  isAdmin: _isAdmin,
  onShowUserManagement: _onShowUserManagement,
  onLogout,
  onShowLoginModal,
  title = "유네코레일 전기팀 자재관리 시스템",
  backUrl = "/"
}: CommonHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      // 기본 로그아웃 처리
      localStorage.removeItem('user')
      // Next.js 라우터를 사용한 클라이언트 사이드 라우팅
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

  const handleBackToMain = () => {
    router.push(backUrl)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          
          {/* 우측: 로그인/사용자 정보 */}
          <div className="flex items-center space-x-4">
            
            
          </div>
        </div>
      </div>
    </header>
  )
}
