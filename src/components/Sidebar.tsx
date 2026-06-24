'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  BarChart3,
  Calendar,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Package2,
  Settings,
  StickyNote,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/useUser'
import { canAccessRoute } from '@/lib/routeAccess'

type NavLeaf = { name: string; href: string }
type NavSubItem = NavLeaf & { subItems?: NavLeaf[] }
type NavItem = { name: string; href: string; icon: any; key: string; subItems?: NavSubItem[] }

const navigationItems: NavItem[] = [
  { name: '대시보드', href: '/dashboard', icon: Home, key: 'dashboard' },
  { name: '재고관리', href: '/stock-management', icon: Package2, key: 'stock_view' },
  {
    name: '업무일지',
    href: '/work-diary',
    icon: FileText,
    key: 'daily_log',
    subItems: [
      { name: '업무일지 작성', href: '/work-diary/write' },
      { name: '업무일지 작성 내역', href: '/work-diary/history' },
      { name: '퇴근/출장 보고', href: '/business-trip-reports' },
      { name: '통계', href: '/work-diary/advanced-stats' }
    ]
  },
  { name: '일정관리', href: '/schedule', icon: Calendar, key: 'schedule' },
  { name: '메모', href: '/memo', icon: StickyNote, key: 'memo' },
  {
    name: '업무도구',
    href: '/work-tool',
    icon: Settings,
    key: 'work_tools',
    subItems: [
      { name: 'SOP', href: '/work-tool/sop' },
      { name: '업무툴', href: '/work-tool/tools' },
      { name: '고장대응', href: '/work-tool/troubleshooting' },
      { name: '기술자료', href: '/work-tool/tech-data' }
    ]
  },
  {
    name: 'AS/SS',
    href: '/as-ss',
    icon: FileText,
    key: 'as_ss',
    subItems: [
      { name: 'AS/SS 등록', href: '/as-ss?action=new' },
      { name: 'AS/SS 조회', href: '/as-ss' },
      {
        name: '매뉴얼/알람 관리',
        href: '/chatbot-admin',
        subItems: [
          { name: '프로젝트', href: '/chatbot-admin?tab=profile' },
          { name: '알람', href: '/chatbot-admin?tab=alarm' },
          { name: '매뉴얼(학습데이터)', href: '/chatbot-admin?tab=manual' }
        ]
      }
    ]
  },
  { name: '내 전용 게시판', href: '/my-board', icon: StickyNote, key: 'my_board' },
  {
    name: 'Nara',
    href: '/nara-monitoring',
    icon: BarChart3,
    key: 'nara',
    subItems: [
      { name: '입찰 모니터링', href: '/nara-monitoring' }
    ]
  },
  {
    name: '설정',
    href: '/settings',
    icon: Users,
    key: 'settings',
    subItems: [
      { name: '회원관리', href: '/user-management' },
      { name: '프로젝트 관리', href: '/project-management' }
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const isCollapsed = false

  // 한 번에 하나의 메뉴만 펼친다(아코디언). 클릭으로 토글하고, 다른 메뉴를 펼치면 이전 것은 닫힌다.
  // (마우스 hover로 자동 열림/닫힘 하던 동작은 제거 — 자동으로 닫혀 불편하다는 요청)
  const [expandedKey, setExpandedKey] = useState<string | null>(() => {
    const activeItem = navigationItems.find((item) =>
      item.subItems && item.subItems.some((sub) => pathname.startsWith(sub.href.split('?')[0]))
    )
    return activeItem ? activeItem.key : null
  })

  // 페이지 이동 시 현재 섹션은 자동으로 펼쳐 둔다(수동으로 다른 걸 열기 전까지 유지)
  useEffect(() => {
    const activeItem = navigationItems.find((item) =>
      item.subItems?.some((sub) => pathname.startsWith(sub.href.split('?')[0]))
    )
    if (activeItem) {
      setExpandedKey(activeItem.key)
    }
  }, [pathname])

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key))
  }

  // 2단계(하부메뉴) 펼침 상태 — 예: '매뉴얼/알람 관리' 아래 알람/챗봇/메뉴얼
  const [expandedSubKey, setExpandedSubKey] = useState<string | null>(() => {
    for (const item of navigationItems) {
      const sub = item.subItems?.find((s) =>
        s.subItems?.some((leaf) => pathname.startsWith(leaf.href.split('?')[0]))
      )
      if (sub) return sub.name
    }
    return null
  })

  useEffect(() => {
    for (const item of navigationItems) {
      const sub = item.subItems?.find((s) =>
        s.subItems?.some((leaf) => pathname.startsWith(leaf.href.split('?')[0]))
      )
      if (sub) {
        setExpandedSubKey(sub.name)
        return
      }
    }
  }, [pathname])

  const toggleSubExpand = (name: string) => {
    setExpandedSubKey((prev) => (prev === name ? null : name))
  }

  const filteredItems = navigationItems.filter((item) => {
    const level = String(user?.level || '1')
    const isAdmin = level.toLowerCase() === 'administrator'
    if (!canAccessRoute(item.href, { level, username: user?.username })) return false
    if (isAdmin) return true

    if (item.key === 'dashboard') return ['3', '4', '5'].includes(level)
    if (item.key === 'stock_view') return user?.stock_view === true || true
    if (item.key === 'daily_log') return user?.daily_log === true || ['3', '4', '5'].includes(level)
    if (item.key === 'schedule') return ['3', '4', '5'].includes(level)
    if (item.key === 'memo') return ['1', '2', '3', '4', '5'].includes(level)
    if (item.key === 'work_tools') return user?.work_tools === true || ['2', '3', '4', '5'].includes(level)
    if (item.key === 'as_ss') return true
    if (item.key === 'my_board') return ['3', '4', '5'].includes(level)
    if (item.key === 'nara') return ['4', '5'].includes(level)
    if (item.key === 'settings') return level === '5'
    return false
  })

  // 접근 가능한 메뉴 경로를 미리 로드(prefetch)해 화면 전환을 빠르게 한다.
  // (클릭 후에야 로드하던 것을 앱 진입 시 백그라운드로 미리 받아둠)
  useEffect(() => {
    if (!user?.id) return
    const hrefs = new Set<string>()
    filteredItems.forEach((item) => {
      hrefs.add(item.href.split('?')[0])
      item.subItems?.forEach((s) => {
        hrefs.add(s.href.split('?')[0])
        s.subItems?.forEach((leaf) => hrefs.add(leaf.href.split('?')[0]))
      })
    })
    hrefs.forEach((h) => { try { router.prefetch(h) } catch { /* 무시 */ } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.level])

  const prefetch = (href: string) => { try { router.prefetch(href.split('?')[0]) } catch { /* 무시 */ } }

  return (
    <aside className={cn(
      'z-[60] flex h-screen flex-col border-r border-gray-800 bg-[#1c1c1c] text-white transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex h-16 items-center border-b border-gray-800 bg-[#1c1c1c] px-4">
        <div className="flex w-full items-center gap-3 overflow-hidden">
          <div className="flex h-8 min-w-[32px] items-center justify-center">
            <Image src="/logo_new.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 items-center">
              <div className="flex flex-col">
                <span className="mb-0.5 whitespace-nowrap text-xl font-bold leading-none tracking-tight text-white">
                  유네코레일(주)
                </span>
                <span className="text-xs font-medium leading-none text-gray-400">
                  전기제어파트
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-6">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const cleanHref = item.href.split('?')[0]
          const isActive = pathname === cleanHref ||
            (pathname.startsWith(cleanHref) && cleanHref !== '/') ||
            item.subItems?.some((sub) =>
              pathname.startsWith(sub.href.split('?')[0]) ||
              sub.subItems?.some((leaf) => pathname.startsWith(leaf.href.split('?')[0]))
            )
          const isExpanded = expandedKey === item.key

          return (
            <div key={item.key}>
              <Button
                variant="ghost"
                onMouseEnter={() => prefetch(item.href)}
                onPointerDown={() => prefetch(item.href)}
                onClick={() => {
                  if (item.subItems) {
                    toggleExpand(item.key)
                  } else {
                    setExpandedKey(null)
                    setExpandedSubKey(null)
                    router.push(item.href)
                  }
                }}
                className={cn(
                  'mb-1 h-10 w-full justify-start',
                  isActive
                    ? 'bg-[#7b68ee] text-white hover:bg-[#6a5acd] hover:text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white',
                  isCollapsed ? 'justify-center px-2' : 'px-3'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                {!isCollapsed && (
                  <div className="flex flex-1 items-center justify-between">
                    <span>{item.name}</span>
                    {item.subItems && (
                      <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
                    )}
                  </div>
                )}
              </Button>

              {!isCollapsed && item.subItems && isExpanded && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.subItems
                    .filter((subItem) => {
                      const level = String(user?.level || '1')
                      const isAdmin = level.toLowerCase() === 'administrator'
                      if (!canAccessRoute(subItem.href, { level, username: user?.username })) return false
                      if (subItem.href === '/work-diary/advanced-stats') return level === '5' || isAdmin
                      return true
                    })
                    .map((subItem) => {
                      // 3단계 하부메뉴(예: 매뉴얼/알람 관리 > 알람/챗봇/메뉴얼)
                      if (subItem.subItems) {
                        const isSubExpanded = expandedSubKey === subItem.name
                        const isSubActive = subItem.subItems.some((leaf) =>
                          pathname.startsWith(leaf.href.split('?')[0])
                        )
                        return (
                          <div key={subItem.name}>
                            <Button
                              variant="ghost"
                              onClick={() => toggleSubExpand(subItem.name)}
                              className={cn(
                                'h-8 w-full justify-start text-sm',
                                isSubActive ? 'font-medium text-white' : 'text-gray-500 hover:text-gray-300'
                              )}
                            >
                              <div className="flex flex-1 items-center justify-between">
                                <span>{subItem.name}</span>
                                <ChevronRight className={cn('h-4 w-4 transition-transform', isSubExpanded && 'rotate-90')} />
                              </div>
                            </Button>
                            {isSubExpanded && (
                              <div className="ml-4 mt-1 space-y-1">
                                {subItem.subItems.map((leaf) => {
                                  const isLeafActive = pathname === leaf.href.split('?')[0]
                                  return (
                                    <Button
                                      key={leaf.href}
                                      variant="ghost"
                                      onClick={() => router.push(leaf.href)}
                                      className={cn(
                                        'h-8 w-full justify-start text-sm',
                                        isLeafActive ? 'font-medium text-white' : 'text-gray-500 hover:text-gray-300'
                                      )}
                                    >
                                      {leaf.name}
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      }
                      const isSubActive = pathname === subItem.href.split('?')[0]
                      return (
                        <Button
                          key={subItem.href}
                          variant="ghost"
                          onMouseEnter={() => prefetch(subItem.href)}
                          onPointerDown={() => prefetch(subItem.href)}
                          onClick={() => router.push(subItem.href)}
                          className={cn(
                            'h-8 w-full justify-start text-sm',
                            isSubActive ? 'font-medium text-white' : 'text-gray-500 hover:text-gray-300'
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

      <div className="border-t border-gray-800 p-4">
        <div className={cn('flex items-center gap-3', isCollapsed ? 'justify-center' : '')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {user?.name} {user?.position}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.department || `Level ${user?.level}`}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-gray-400 hover:bg-white/10 hover:text-white"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
