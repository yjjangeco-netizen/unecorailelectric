'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Package2, FileText, Calendar, Settings, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

export default function BottomMenu() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

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

  // 앱 화면의 메뉴 개수에 맞춰 균등하게 배치
  return (
    <nav className="flex items-center justify-around bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-12 sm:pb-2 pt-2 px-2 z-[60]">
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
  )
}
