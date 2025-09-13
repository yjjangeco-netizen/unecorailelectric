'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { useUser } from '@/hooks/useUser'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isAuthenticated, loading } = useUser()
  
  // 자동 로그아웃 비활성화
  const resetActivity = () => {}
  const timeRemaining = () => 0
  
  // 클라이언트 사이드 마이그레이션 실행 (한 번만)
  useEffect(() => {
    try {
      // 정렬 관련 localStorage 한 번만 치환
      const oldOrderBy = localStorage.getItem('inv.orderBy')
      if (oldOrderBy === 'name') {
        localStorage.setItem('inv.orderBy', 'product')
        console.log('정렬 치환: name → product')
      }
    } catch (error) {
      console.warn('정렬 치환 실패:', error)
    }
  }, [])

  // 로그인과 회원가입 페이지에서는 navigation 표시하지 않음
  const shouldShowNavigation = !['/', '/signup'].includes(pathname) && isAuthenticated && !loading

  return (
    <>
      {shouldShowNavigation && <Navigation />}
      {children}
    </>
  )
}
