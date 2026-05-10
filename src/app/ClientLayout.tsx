'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Sidebar from '@/components/Sidebar'
import PageBanner from '@/components/PageBanner'
import BottomMenu from '@/components/BottomMenu'
import { Bell, Menu } from 'lucide-react'
interface PageInfo {
  title: string
  subtitle: string
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, loading } = useUser()
  
  // 서비스 워커 등록 (PWA)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker 등록 성공:', registration.scope)
        })
        .catch((error) => {
          console.log('Service Worker 등록 실패:', error)
        })
    }
  }, [])

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

  // 페이지 정보 매핑
  const getPageInfo = (path: string): PageInfo => {
    // 서브 경로 처리를 위해 startsWith 사용 가능하도록 정렬
    // 업무일지 관련 페이지별 타이틀 설정
    if (path === '/work-diary/write') {
      return {
        title: '업무일지 작성',
        subtitle: '일일 업무 내용을 작성하고 등록합니다.'
      }
    }
    if (path === '/work-diary/advanced-stats') {
      return {
        title: '통계',
        subtitle: '다양한 조건으로 업무 통계를 검색하고 분석합니다.'
      }
    }
    if (path === '/work-diary') {
      return {
        title: '업무일지',
        subtitle: '매일의 업무를 기록하고 팀원들과 공유하세요.'
      }
    }
    if (path.startsWith('/business-trip-reports')) {
      return {
        title: '외근/출장 보고',
        subtitle: '외근 및 출장 보고서를 작성하고 관리합니다.'
      }
    }

    const pageMap: { [key: string]: PageInfo } = {
      '/dashboard': {
        title: '대시보드',
        subtitle: '전체 현황을 한눈에 확인하고 주요 지표를 모니터링하세요.'
      },
      '/stock-management': {
        title: '재고관리',
        subtitle: '자재 입출고 및 재고 현황을 효율적으로 관리하세요.'
      },
      '/schedule': {
        title: '일정관리',
        subtitle: '팀의 주요 일정과 이벤트를 캘린더에서 확인하세요.'
      },
      '/project-management': {
        title: '프로젝트 관리',
        subtitle: '진행 중인 프로젝트의 상태와 이슈를 추적하세요.'
      },
      '/nara-monitoring': {
        title: '나라장터 모니터링',
        subtitle: '나라장터 입찰 공고를 실시간으로 모니터링하세요.'
      },
      '/sop': {
        title: 'SOP',
        subtitle: '표준 운영 절차(SOP)를 확인하고 업무에 적용하세요.'
      },
      '/work-tool': {
        title: '업무도구',
        subtitle: '업무 효율을 높여주는 다양한 도구들을 활용하세요.'
      },
      '/work-tool/sop': {
        title: 'SOP',
        subtitle: '표준 운영 절차(SOP) 게시판입니다.'
      },
      '/work-tool/tools': {
        title: '업무툴',
        subtitle: '다양한 업무 보조 툴 및 프로그램 자료 게시판입니다.'
      },
      '/work-tool/troubleshooting': {
        title: '고장대응',
        subtitle: '현장 고장 대응 사례 및 조치 내역을 공유하는 게시판입니다.'
      },
      '/work-tool/tech-data': {
        title: '기술자료',
        subtitle: '장비 매뉴얼, 도면 등 기술 자료를 보관하는 게시판입니다.'
      },
      '/settings': {
        title: '설정',
        subtitle: '시스템 설정 및 사용자 권한을 관리하세요.'
      },
      '/user-management': {
        title: '사용자 관리',
        subtitle: '사용자 계정 및 권한을 관리하세요.'
      },
      '/nara-settings': {
        title: '입찰모니터링 관리',
        subtitle: '나라장터 입찰 모니터링 설정을 관리하세요.'
      },
      '/manual-management': {
        title: '메뉴얼 관리',
        subtitle: '업무 메뉴얼을 등록하고 관리하세요.'
      },
      '/leave-management': {
        title: '연차/반차 관리',
        subtitle: '연차 및 반차 신청 내역을 관리하세요.'
      },
      '/as-ss': {
        title: 'AS/SS 관리',
        subtitle: '장비 고장 접수 및 조치 내역을 관리합니다.'
      },
      '/business-trip-management': {
        title: '출장/외근 관리',
        subtitle: '출장 및 외근 신청 내역을 관리하세요.'
      }
    }

    return pageMap[path] || {
      title: 'UNECO RAIL',
      subtitle: '유네코레일 전기팀 자재관리 시스템입니다.'
    }
  }

  const pageInfo = getPageInfo(pathname)

  const [isApp, setIsApp] = useState(false)
  
  useEffect(() => {
    // isNativePlatform()은 네이티브 앱(Android/iOS)에서만 true, 웹브라우저에서는 항상 false
    const checkIsApp = () => {
      if (typeof window !== 'undefined') {
        try {
          const cap = (window as any).Capacitor;
          if (cap && typeof cap.isNativePlatform === 'function') {
            return cap.isNativePlatform();
          }
        } catch (e) {
          return false;
        }
      }
      return false;
    };
    setIsApp(checkIsApp());
  }, [])

  return (
    <div className={isApp ? "flex flex-col h-[100dvh] bg-[#f4f5f7] relative" : "flex h-[100dvh] bg-[#f4f5f7] relative"}>
      {shouldShowHeader && !isApp && <Sidebar />}
      
      <main className="flex-1 overflow-hidden flex flex-col relative w-full">
        {shouldShowHeader && user && (
          <div className="bg-white/90 backdrop-blur-md border-b border-gray-100/50 shadow-sm px-4 md:px-6 pt-12 pb-3 md:py-3 flex items-center justify-between sticky top-0 z-50 shrink-0">
            {/* 좌측: 소속 및 이름 */}
            <div className="text-sm text-blue-600 font-bold flex-1 flex justify-start">
              {user.department || ''} {user.name}
            </div>
            
            {/* 중앙: 브랜드명 */}
            <div className="text-xl sm:text-2xl font-black tracking-widest text-[#1e3a8a] flex-1 flex justify-center uppercase drop-shadow-sm">
              UNECORAIL
            </div>
            
            {/* 우측: 알람 및 햄버거 메뉴 */}
            <div className="flex items-center justify-end gap-2 flex-1">
              <button className="relative p-1.5 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all group">
                <Bell className="w-5 h-5 group-hover:animate-swing" />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/20 animate-pulse"></span>
              </button>
              <button className="p-1.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-6 mb-16 md:mb-0">
          {shouldShowHeader && (
            <PageBanner 
              title={pageInfo.title} 
              subtitle={pageInfo.subtitle} 
            />
          )}
          {children}
        </div>
      </main>
      
      {/* 앱일 경우에만 하단 메뉴바 표시 (모바일에서는 MobileCalendar 내장 메뉴 사용) */}
      {shouldShowHeader && isApp && (
        <div className="absolute bottom-0 left-0 right-0 z-[100] bg-white text-black hidden md:block">
          <BottomMenu />
        </div>
      )}
    </div>
  )
}
