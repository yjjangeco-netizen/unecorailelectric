'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Package2, 
  FileText, 
  Calendar, 
  Settings, 
  BarChart3, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/useUser'
import { useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems = [
    { name: '대시보드', href: '/dashboard', icon: Home, key: 'dashboard' },
    { name: '재고관리', href: '/stock-management', icon: Package2, key: 'stock_view' },
    { name: '업무일지', href: '/work-diary', icon: FileText, key: 'daily_log' },
    { name: '일정관리', href: '/schedule', icon: Calendar, key: 'schedule' },
    { name: '업무도구', href: '/work-tool', icon: Settings, key: 'work_tools' },
    { name: 'SOP', href: '/sop', icon: FileText, key: 'sop' },
    { name: 'Nara', href: '/nara-monitoring', icon: BarChart3, key: 'nara' },
    { name: '설정', href: '/settings', icon: Users, key: 'settings' },
  ]

  // Filter items based on user level (simplified logic for now, can be expanded)
  const filteredItems = navigationItems.filter(item => {
    if (!user) return false
    const level = user.level || '1'
    const isAdmin = level.toLowerCase() === 'administrator'
    if (isAdmin) return true
    
    // Basic level checks matching CommonHeader logic
    if (item.key === 'dashboard') return true
    if (item.key === 'stock_view') return true
    if (item.key === 'daily_log') return ['2', '3', '4', '5'].includes(level)
    if (item.key === 'schedule') return ['3', '4', '5'].includes(level)
    if (item.key === 'work_tools') return ['3', '4', '5'].includes(level)
    if (item.key === 'sop') return ['3', '4', '5'].includes(level)
    if (item.key === 'nara') return ['4', '5'].includes(level)
    if (item.key === 'settings') return level === '5'
    return false
  })

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-[#1c1c1c] text-white transition-all duration-300 border-r border-gray-800",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="min-w-[32px] h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-lg">U</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">
              UNECO RAIL
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full justify-start h-10 mb-1",
                isActive 
                  ? "bg-[#7b68ee] text-white hover:bg-[#6a5acd] hover:text-white" 
                  : "text-gray-400 hover:text-white hover:bg-white/10",
                isCollapsed ? "px-2 justify-center" : "px-3"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Button>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">Level {user?.level}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-20 bg-[#1c1c1c] border border-gray-700 rounded-full w-6 h-6 p-0 hover:bg-gray-800 text-gray-400"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  )
}
