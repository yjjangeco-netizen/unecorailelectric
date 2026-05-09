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
              {/* Compact 2-column Action Buttons */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mb-12 mt-4">
                {/* 업무일지 작성 */}
                <button 
                  onClick={() => router.push('/work-diary/write')}
                  className="flex flex-col items-center justify-center py-8 px-4 bg-white rounded-2xl shadow-sm border border-orange-100 hover:shadow-md hover:border-orange-300 hover:bg-orange-50/30 transition-all group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-7 w-7 text-orange-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-base sm:text-lg">업무일지 작성</span>
                </button>

                {/* 업무일지 편집/내역 (History) */}
                <button 
                  onClick={() => router.push('/work-diary/history')}
                  className="flex flex-col items-center justify-center py-8 px-4 bg-white rounded-2xl shadow-sm border border-purple-100 hover:shadow-md hover:border-purple-300 hover:bg-purple-50/30 transition-all group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Printer className="h-7 w-7 text-purple-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-base sm:text-lg">내역 및 편집</span>
                </button>

                {/* 외근/출장 보고 */}
                <button 
                  onClick={() => router.push('/business-trip-reports')}
                  className="flex flex-col items-center justify-center py-8 px-4 bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30 transition-all group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="h-7 w-7 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-base sm:text-lg">외근/출장 보고</span>
                </button>

                {/* 업무일지 요약 (AI) */}
                <button 
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="flex flex-col items-center justify-center py-8 px-4 bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-md hover:border-pink-300 hover:bg-pink-50/30 transition-all group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-7 w-7 text-pink-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-base sm:text-lg">AI 업무 요약</span>
                </button>
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