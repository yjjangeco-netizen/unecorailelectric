'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import {
  FileText,
  Search,
  Calendar,
  Clock,
  Users,
  BarChart3,
  MapPin,
  Briefcase,
  Printer,
  Sparkles
} from 'lucide-react'
import WorkDiaryReportModal from '@/components/WorkDiaryReportModal'
import WorkDiarySummaryModal from '@/components/WorkDiarySummaryModal'

interface WorkDiaryEntry {
  id: number
  userId: string
  workDate: string
  projectId: number
  workContent: string
  createdAt: string
  updatedAt: string
  workType?: string
  workSubType?: string
  customProjectName?: string
  project?: {
    id: number
    project_name: string
    project_number: string
    description?: string
  }
  user?: {
    id: string
    name: string
    level: string
    department?: string
    position?: string
  }
}

interface BusinessTripReport {
  id: string
  title: string
  content: string
  submitted_at: string
  status: string
  business_trips: {
    id: string
    title: string
    purpose: string
    location: string
    start_date: string
    end_date: string
    user_name: string
  }
}

export default function WorkDiaryPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [recentDiaries, setRecentDiaries] = useState<WorkDiaryEntry[]>([])
  const [businessTripReports, setBusinessTripReports] = useState<BusinessTripReport[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Level2 이상 권한 확인
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const userLevel = user.level || '1'
      console.log('현재 사용자 정보:', user)
      console.log('사용자 레벨:', userLevel)
      console.log('Level 5 체크:', userLevel === '5')
      console.log('Administrator 체크:', userLevel === 'administrator')
      // Level 1 사용자도 업무일지 접근 가능하도록 수정
      // if (userLevel === '1') {
      //   router.push('/dashboard')
      // }
    }
  }, [authLoading, isAuthenticated, user, router])

  // 최근 업무일지 데이터 로드
  useEffect(() => {
    const loadRecentDiaries = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/work-diary?limit=5')
        if (response.ok) {
          const result = await response.json()
          setRecentDiaries(result.data || [])
        }
      } catch (error) {
        console.error('최근 업무일지 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user) {
      loadRecentDiaries()
    }
  }, [isAuthenticated, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Level1 사용자는 접근 불가
  if (user?.level === '1') {
    return null
  }

  return (
    <AuthGuard requiredLevel={3}>
      <div className="min-h-screen bg-white">


        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7] min-h-screen">
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">


              {/* Action Cards Grid */}
              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                {/* 업무일지 작성 카드 */}
                <div 
                  onClick={() => router.push('/work-diary/write')}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-7 w-7 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">업무일지 작성</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                    오늘의 업무 내용을 기록하고 관리합니다.
                  </p>
                  <div className="flex items-center text-orange-600 font-semibold text-sm">
                    작성하기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* AI 업무일지 요약 카드 */}
                <div 
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-7 w-7 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">업무일지 요약</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                    AI가 업무를 분석하고 인사이트를 제공합니다.
                  </p>
                  <div className="flex items-center text-purple-600 font-semibold text-sm">
                    분석하기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* 통계 카드 */}
                <div 
                  onClick={() => router.push('/work-diary/advanced-stats')}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-7 w-7 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">통계</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                    업무 현황과 팀 성과를 분석합니다.
                  </p>
                  <div className="flex items-center text-violet-600 font-semibold text-sm">
                    확인하기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* 외근/출장 보고서 작성 카드 */}
                <div 
                  onClick={() => router.push('/business-trip-reports')}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="h-7 w-7 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">외근/출장 보고서 작성</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                    외근 및 출장 보고서를 작성하고 관리합니다.
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold text-sm">
                    작성하기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* 보고서 출력 카드 */}
                <div 
                  onClick={() => setIsReportModalOpen(true)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Printer className="h-7 w-7 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">보고서 출력</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                    업무 일지를 보고서로 출력하고 관리합니다.
                  </p>
                  <div className="flex items-center text-green-600 font-semibold text-sm">
                    작성하기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>

              {/* 보고서 모달 */}
              <WorkDiaryReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
              />

              {/* AI 요약 모달 */}
              <WorkDiarySummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
              />


            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}