'use client'

import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Home, 
  Package2, 
  FileText, 
  Calendar, 
  Settings, 
  Users, 
  LogOut,
  ChevronRight,
  BarChart3,
  Pin,
  PinOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'

  // Navigation items defined outside component to prevent re-creation on every render
  const navigationItems = [
    { name: '대시보드', href: '/dashboard', icon: Home, key: 'dashboard' },
    { name: '재고관리', href: '/stock-management', icon: Package2, key: 'stock_view' },
    { 
      name: '업무일지', 
      href: '/work-diary', 
      icon: FileText, 
      key: 'daily_log',
      subItems: [
        { name: '대시보드', href: '/work-diary' },
        { name: '업무일지 작성', href: '/work-diary/write' },
        { name: '업무일지 작성 내역', href: '/work-diary/history' },
        { name: '외근/출장 보고', href: '/business-trip-reports' },
        { name: '통계', href: '/work-diary/advanced-stats' }
      ]
    },
    { name: '일정관리', href: '/schedule', icon: Calendar, key: 'schedule' },
    { name: '업무도구', href: '/work-tool', icon: Settings, key: 'work_tools' },
    { name: 'SOP', href: '/sop', icon: FileText, key: 'sop' },
    { name: 'Nara', href: '/nara-monitoring', icon: BarChart3, key: 'nara' },
    { 
      name: '설정', 
      href: '/settings', 
      icon: Users, 
      key: 'settings',
      subItems: [
        { name: '설정 홈', href: '/settings' },
        { name: '회원관리', href: '/user-management' },
        { name: '프로젝트 관리', href: '/project-management' },
        { name: '입찰모니터링 관리', href: '/nara-settings' }
      ]
    },
  ]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const [isPinned, setIsPinned] = useState(false)
  const [isHovered, setIsHovered] = useState(false)


  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const activeItem = navigationItems.find(item => 
      item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href))
    )
    return activeItem ? [activeItem.key] : []
  })

  // Update expanded items when pathname changes
  useEffect(() => {
    // Find the item that contains the current path in its subItems
    const activeItem = navigationItems.find(item => 
      item.subItems?.some(sub => pathname.startsWith(sub.href))
    )
    
    // If found, expand it if not already expanded
    if (activeItem) {
      setExpandedItems(prev => prev.includes(activeItem.key) ? prev : [...prev, activeItem.key])
    }
  }, [pathname])




  const isCollapsed = !isPinned && !isHovered

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Filter items based on user permissions (individual permissions take priority over level)
  const filteredItems = navigationItems.filter(item => {
    const level = String(user?.level || '1')
    const isAdmin = level.toLowerCase() === 'administrator'
    if (isAdmin) return true
    
    // 개별 권한 필드가 있으면 우선 사용, 없으면 레벨 기반 기본값 사용
    if (item.key === 'dashboard') {
      // 대시보드는 레벨 3 이상
      return ['3', '4', '5'].includes(level)
    }
    if (item.key === 'stock_view') {
      // stock_view 권한 필드 확인, 없으면 모든 레벨 허용
      return user?.stock_view === true || true
    }
    if (item.key === 'daily_log') {
      // daily_log 권한 필드 확인, 없으면 레벨 3, 4, 5
      return user?.daily_log === true || ['3', '4', '5'].includes(level)
    }
    if (item.key === 'schedule') {
      // 일정관리는 레벨 3 이상
      return ['3', '4', '5'].includes(level)
    }
    if (item.key === 'work_tools') {
      // work_tools는 레벨 4, 5 (개별 권한 무시)
      return ['4', '5'].includes(level)
    }
    if (item.key === 'sop') {
      // sop 권한 필드 확인, 없으면 레벨 5만
      return user?.sop === true || (level === '5')
    }
    if (item.key === 'nara') {
      // NARA는 레벨 5만
      return level === '5'
    }
    if (item.key === 'settings') {
      // 설정 메뉴는 레벨 5(관리자)만 접근 가능
      return level === '5'
    }
    return false
  })

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-[#1c1c1c] text-white transition-all duration-300 border-r border-gray-800 z-[60]",
        isCollapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-800 bg-[#1c1c1c]">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <div className="min-w-[32px] h-8 flex items-center justify-center">
            <Image src="/logo_new.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight whitespace-nowrap text-white leading-none mb-0.5">
                  유네코레일(주)
                </span>
                <span className="text-xs text-gray-400 font-medium leading-none">
                  전기제어파트
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPinned(!isPinned)}
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10 ml-1"
                title={isPinned ? "자동 숨김 켜기" : "고정하기"}
              >
                {isPinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href) && item.href !== '/') ||
            (item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href)))
          const isExpanded = expandedItems.includes(item.key)
          
          return (
            <div 
              key={item.key}
              onMouseLeave={() => {
                // 마우스가 떨어지면 서브메뉴 접기
                if (item.subItems && !isCollapsed && expandedItems.includes(item.key)) {
                  toggleExpand(item.key)
                }
              }}
            >
              <Button
                variant="ghost"
                onMouseEnter={() => {
                  // 마우스 오버 시 서브메뉴가 있으면 자동으로 펼치기
                  if (item.subItems && !isCollapsed) {
                    if (!expandedItems.includes(item.key)) {
                      toggleExpand(item.key)
                    }
                  }
                }}
                onClick={() => {
                  // 서브메뉴가 있고 사이드바가 펼쳐져 있으면 -> 확장/축소 토글만 (이동 X)
                  if (item.subItems && !isCollapsed) {
                    toggleExpand(item.key)
                    return // 페이지 이동 방지
                  }
                  
                  // 그 외 (서브메뉴 없음 OR 사이드바 접힘) -> 해당 페이지로 이동
                  router.push(item.href)
                }}
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
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.subItems && (
                      <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                    )}
                  </div>
                )}
              </Button>

              {/* Subitems */}
              {!isCollapsed && item.subItems && isExpanded && (
                <div className="ml-9 space-y-1 mt-1">
                  {item.subItems
                    .filter((subItem) => {
                      const level = user?.level || '1'
                      const isAdmin = level.toLowerCase() === 'administrator'
                      
                      // 통계는 레벨 5만
                      if (subItem.href === '/work-diary/advanced-stats') {
                        return level === '5' || isAdmin
                      }
                      return true
                    })
                    .map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Button
                          key={subItem.href}
                          variant="ghost"
                          onClick={() => router.push(subItem.href)}
                          className={cn(
                            "w-full justify-start h-8 text-sm",
                            isSubActive
                              ? "text-white font-medium"
                              : "text-gray-500 hover:text-gray-300"
                          )}
                        >
                          {subItem.name}
                        </Button>
                      )
                    })}
                </div>
              )}
            </div>
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
              <p className="text-sm font-medium truncate">
                {user?.name} {user?.position}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.department === '전기팀' ? '기술부 전기팀' : (user?.department || `Level ${user?.level}`)}
              </p>
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
      
      {/* Collapse Toggle Removed */}
    </aside>
  )
}
