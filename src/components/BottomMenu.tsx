'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, Calendar, StickyNote, Settings, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { isAssistantOwner } from '@/lib/assistantAccess'

export default function BottomMenu() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  const navigationItems = [
    { name: '대시보드', href: '/dashboard', icon: Home, key: 'dashboard' },
    { name: '업무도구', href: '/work-tool', icon: Settings, key: 'work_tools' },
    { name: '업무일지', href: '/work-diary', icon: FileText, key: 'daily_log' },
    { name: '일정', href: '/schedule', icon: Calendar, key: 'schedule' },
    { name: '메모', href: '/memo', icon: StickyNote, key: 'memo' },
    { name: 'AI', href: '/assistant-automation', icon: Bot, key: 'assistant_automation' },
    { name: '설정', href: '/settings', icon: Settings, key: 'settings' },
  ]

  const filteredItems = navigationItems.filter(item => {
    const level = String(user?.level || '1')
    const isAdmin = level.toLowerCase() === 'administrator'
    if (isAdmin) return true
    if (item.key === 'dashboard') return ['3', '4', '5'].includes(level)
    if (item.key === 'work_tools') return user?.work_tools === true || ['2', '3', '4', '5'].includes(level)
    if (item.key === 'daily_log') return user?.daily_log === true || ['3', '4', '5'].includes(level)
    if (item.key === 'schedule') return ['3', '4', '5'].includes(level)
    if (item.key === 'memo') return ['1', '2', '3', '4', '5'].includes(level)
    if (item.key === 'assistant_automation') return isAssistantOwner(user)
    if (item.key === 'settings') return level === '5'
    return false
  })

  return (
    <nav
      className="md:hidden flex items-stretch justify-around overflow-x-auto bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-1 pt-1.5 z-[100]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      {filteredItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
        return (
          <button
            key={item.key}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex min-w-[58px] flex-1 flex-col items-center justify-center rounded-md py-1.5 transition-colors",
              isActive ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            <span className="mt-1 text-[10px] font-medium leading-none whitespace-nowrap">
              {item.name}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
