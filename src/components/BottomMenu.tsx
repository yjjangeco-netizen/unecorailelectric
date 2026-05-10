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
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <>
      {/* 모바일: FAB 스타일 플로팅 버튼 (좌측 하단) */}
      <div className="md:hidden fixed bottom-6 left-5 z-[110]">
        {/* 메뉴 팝업 */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[109]" onClick={() => setIsOpen(false)} />
            <div className="absolute bottom-16 left-0 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden min-w-[160px] z-[111]"
              style={{ animation: 'fadeInUp 0.15s ease' }}>
              {filteredItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                return (
                  <button
                    key={item.key}
                    onClick={() => { router.push(item.href); setIsOpen(false) }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0",
                      isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                )
              })}
            </div>
          </>
        )}
        {/* 플로팅 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
            isOpen ? "bg-gray-600 rotate-90" : "bg-gray-800"
          )}
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* 데스크톱: 기존 전체 바 */}
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
                "text-[10px] mt-1 font-medium",
                isActive ? "text-blue-600" : "text-gray-500"
              )}>
                {item.name}
              </span>
            </button>
          )
        })}
      </nav>

      <style jsx>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  )
}
