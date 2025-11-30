'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Sidebar from '@/components/Sidebar'
import PageBanner from '@/components/PageBanner'

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

  return (
    <div className="flex h-screen bg-[#f4f5f7]">
      {shouldShowHeader && <Sidebar />}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-auto p-6">
          {shouldShowHeader && (
            <PageBanner 
              title={pageInfo.title} 
              subtitle={pageInfo.subtitle} 
            />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
