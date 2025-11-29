'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Sidebar from '@/components/Sidebar'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, loading } = useUser()
  
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

  // 로그인과 회원가입 페이지에서는 헤더 표시하지 않음
  const shouldShowHeader = !['/', '/signup', '/login'].includes(pathname) && isAuthenticated && !loading

  // 현재 페이지 이름 매핑
  const getPageName = (path: string) => {
    const pageMap: { [key: string]: string } = {
      '/project-management': '프로젝트관리',
      '/nara-monitoring': 'Nara 모니터링',
      '/sop': 'SOP',
      '/work-tool': '업무도구',
      '/stock-management': '재고관리',
      '/dashboard': '대시보드',
      '/work-diary': '업무일지',
      '/schedule': '일정관리',
      '/settings': '설정'
    }
    return pageMap[path] || '시스템'
  }

  return (
    <div className="flex h-screen bg-[#f4f5f7]">
      {shouldShowHeader && <Sidebar />}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {shouldShowHeader && (
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <h1 className="text-xl font-bold text-gray-800">{getPageName(pathname)}</h1>
            {/* Add top header actions here if needed */}
          </header>
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
