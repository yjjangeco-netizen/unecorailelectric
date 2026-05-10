'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Package2, FileText, Calendar, Settings, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

export default function BottomMenu() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [isExpanded, setIsExpanded] = useState(false)

  const navigationItems = [
    { name: '대시보드', href: '/dashboard', icon: Home, key: 'dashboard' },
    { name: 'AS/SS', href: '/as-ss', icon: Package2, key: 'as_ss' },
    { name: '업무일지', href: '/work-diary', icon: FileText, key: 'daily_log' },
    { name: '일정', href: '/schedule', icon: Calendar, key: 'schedule' },
    { name: '설정', href: '/settings', icon: Settings, key: 'settings' },
  ]

  const filteredItems = navigationItems.filter(item => {
    const level = String(user?.level || '1')
    const isAdmin = level.toLowerCase() === 'administrator'
    if (isAdmin) return true
    
    if (item.key === 'dashboard') return ['3', '4', '5'].includes(level)
    if (item.key === 'as_ss') return true
    if (item.key === 'daily_log') return user?.daily_log === true || ['3', '4', '5'].includes(level)
    if (item.key === 'schedule') return ['3', '4', '5'].includes(level)
    if (item.key === 'settings') return level === '5'
    return false
  })

  // 현재 페이지명 찾기
  const currentPage = filteredItems.find(item => 
    pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
  )

  return (
    <>
      {/* 모바일: 컴팩트 햄버거 버튼 */}
      <div className="md:hidden">
        {/* 펼쳐진 메뉴 */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-white pb-safe">
            <nav className="flex items-center justify-around pt-2 pb-10 px-2">
              {filteredItems.slice(0, 5).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                return (
                  <button
                    key={item.key}
                    onClick={() => { router.push(item.href); setIsExpanded(false) }}
                    className={cn(
                      "flex flex-col items-center justify-center w-full py-1.5 transition-all duration-200",
                      isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <div className={cn(
                      "p-1 rounded-full transition-all duration-200",
                      isActive ? "bg-blue-50 scale-110" : ""
                    )}>
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={cn(
                      "text-[10px] mt-0.5 font-medium",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )}>
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        )}
        {/* 컴팩트 바: 햄버거 버튼만 */}
        <div className="flex items-center justify-between px-4 py-2 pb-10 border-t border-gray-100 bg-white">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isExpanded ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
            <span className="text-xs font-medium text-gray-500">
              {currentPage ? currentPage.name : '메뉴'}
            </span>
          </button>
        </div>
      </div>

      {/* 데스크톱: 기존 전체 메뉴 (필요시) */}
      <nav className="hidden md:flex items-center justify-around bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-2 pt-2 px-2 z-[60]">
        {filteredItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center w-full py-2 transition-all duration-200",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                isActive ? "bg-blue-50 scale-110" : ""
              )}>
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium transition-all duration-200",
                isActive ? "text-blue-600" : "text-gray-500"
              )}>
                {item.name}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
