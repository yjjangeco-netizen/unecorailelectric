'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CommonHeader from '@/components/CommonHeader'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Settings, 
  BarChart3,
  Eye,
  Plus,
  Minus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle,
  FileText
} from 'lucide-react'
import BusinessTripReportModal from '@/components/BusinessTripReportModal'

interface LocalEvent {
  id: string
  category: string
  subCategory?: string
  subSubCategory?: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  participant: {
    id: string
    name: string
    level: number
  }
  createdBy: {
    id: string
    name: string
    level: number
  }
  createdAt: string
  reported?: boolean // 보고 완료 여부
}

export default function DashboardPage() {
  const { user, isAuthenticated, canAccessFeature, loading } = useUser()
  const router = useRouter()
  
  // 출장/외근 일정 상태 관리
  const [businessTrips, setBusinessTrips] = useState<LocalEvent[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  
  // 연월차 일정 상태 관리
  const [vacationEvents, setVacationEvents] = useState<LocalEvent[]>([])
  
  // 프로젝트 일정 상태 관리
  const [projectEvents, setProjectEvents] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  
  // 보고서 작성 모달 상태
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<LocalEvent | null>(null)
  const [submittingReport, setSubmittingReport] = useState(false)
  

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    // 로딩이 완료된 후에만 리다이렉트 체크
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]); // loading 상태 추가

  // 출장/외근 일정 로드
  const loadBusinessTrips = useCallback(async () => {
    if (!user?.id) return
    
    setLoadingTrips(true)
    try {
      // 레벨 5 이상은 모든 사용자의 미보고 항목 조회, 그 외는 자신의 것만
      const isLevel5OrAdmin = user.level === '5' || user.level === 'administrator'
      const apiUrl = isLevel5OrAdmin 
        ? '/api/business-trips?status=pending' 
        : `/api/business-trips?userId=${user.id}&status=pending`
      
      const response = await fetch(apiUrl)
      console.log('출장/외근 API 응답 상태:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('출장/외근 API 응답 데이터:', data)
        console.log('API 응답 전체 구조:', JSON.stringify(data, null, 2))
        const trips = data.trips || []
        console.log('전체 출장/외근 개수:', trips.length)
        console.log('trips 배열 내용:', trips)
        
        // 미보고 항목만 필터링 (report_status가 'pending'인 것)
        const unreportedTrips = trips.filter((trip: any) => trip.report_status === 'pending')
        console.log('미보고 출장/외근 개수:', unreportedTrips.length)
        
        // LocalEvent 형식으로 변환
        const formattedTrips: LocalEvent[] = unreportedTrips.map((trip: any) => ({
          id: trip.id,
          category: '출장/외근',
          subCategory: trip.trip_type === 'business' ? '출장' : '외근',
          subSubCategory: trip.purpose || '기타',
          summary: `[${trip.trip_type === 'business' ? '출장' : '외근'}] ${trip.title}`,
          description: trip.purpose,
          location: trip.location || '미지정',
          start: {
            dateTime: trip.start_date + (trip.start_time ? 'T' + trip.start_time : ''),
            date: trip.start_date
          },
          end: {
            dateTime: trip.end_date + (trip.end_time ? 'T' + trip.end_time : ''),
            date: trip.end_date
          },
          participant: {
            id: trip.user_id,
            name: trip.user_name,
            level: trip.user_level || '1'
          },
          createdBy: {
            id: trip.created_by || trip.user_id,
            name: trip.created_by_name || trip.user_name,
            level: trip.created_by_level || trip.user_level || '1'
          },
          createdAt: trip.created_at,
          reported: trip.report_status === 'submitted'
        }))
        
        // localStorage의 businessTrips도 함께 조회
        const storedBusinessTrips = localStorage.getItem('businessTrips')
        let localStorageTrips: LocalEvent[] = []
        
        if (storedBusinessTrips) {
          const businessTripsData = JSON.parse(storedBusinessTrips)
          console.log('localStorage businessTrips 데이터:', businessTripsData)
          
          localStorageTrips = businessTripsData.map((trip: any) => ({
            id: trip.id,
            category: '출장/외근',
            subCategory: trip.trip_type === 'business' ? '출장' : '외근',
            subSubCategory: trip.purpose || '기타',
            summary: `[${trip.trip_type === 'business' ? '출장' : '외근'}] ${trip.title}`,
            description: trip.purpose,
            location: trip.location || '미지정',
            start: {
              dateTime: trip.start_date + (trip.start_time ? 'T' + trip.start_time : ''),
              date: trip.start_date
            },
            end: {
              dateTime: trip.end_date + (trip.end_time ? 'T' + trip.end_time : ''),
              date: trip.end_date
            },
            participant: {
              id: trip.user_id,
              name: trip.user_name,
              level: trip.user_level || '1'
            },
            createdBy: {
              id: trip.created_by || trip.user_id,
              name: trip.created_by_name || trip.user_name,
              level: trip.created_by_level || trip.user_level || '1'
            },
            createdAt: trip.created_at,
            reported: trip.report_status === 'submitted'
          }))
        }
        
        // API 데이터와 localStorage 데이터 합치기
        const allTrips = [...formattedTrips, ...localStorageTrips]
        console.log('합쳐진 출장/외근 데이터:', allTrips)
        
        // 데이터가 없으면 localStorage의 localEvents에서도 조회
        if (allTrips.length === 0) {
          console.log('API와 localStorage businessTrips에 데이터가 없음, localEvents에서 조회')
          const storedEvents = localStorage.getItem('localEvents')
          if (storedEvents) {
            const allEvents: LocalEvent[] = JSON.parse(storedEvents)
            console.log('localStorage localEvents에서 로드된 모든 이벤트:', allEvents)
            
            const businessTripEvents = allEvents.filter(event => {
              if (event.category !== '출장/외근' && event.category !== '출장' && event.category !== '외근' && event.subCategory !== '출장' && event.subCategory !== '외근') {
                return false
              }
              
              const isLevel5OrAdmin = user?.level === '5' || user?.level === 'administrator'
              if (!isLevel5OrAdmin && event.participant.id !== user?.id) {
                return false
              }
              
              // reported 속성이 false이거나 없는 경우 모두 표시 (미보고로 간주)
              return !event.reported
            })
            
            console.log('localEvents에서 필터링된 출장/외근 이벤트:', businessTripEvents)
            setBusinessTrips(businessTripEvents)
          } else {
            setBusinessTrips(allTrips)
          }
        } else {
          setBusinessTrips(allTrips)
        }
      } else {
        console.warn('출장/외근 API 실패, localStorage에서 로드')
        // API 실패 시 localStorage에서 로드
        const storedEvents = localStorage.getItem('localEvents')
        if (storedEvents) {
          const allEvents: LocalEvent[] = JSON.parse(storedEvents)
          console.log('localStorage에서 로드된 모든 이벤트:', allEvents)
          
          // 출장/외근 카테고리만 필터링
          const businessTripEvents = allEvents.filter(event => {
            console.log('이벤트 필터링 체크:', {
              id: event.id,
              category: event.category,
              subCategory: event.subCategory,
              summary: event.summary,
              participant: event.participant,
              reported: event.reported
            })
            
            if (event.category !== '출장/외근' && event.category !== '출장' && event.category !== '외근' && event.subCategory !== '출장' && event.subCategory !== '외근') {
              console.log('카테고리 불일치로 제외:', event.category, event.subCategory)
              return false
            }
            
            // 레벨 5 이상이 아니면 자신의 것만
            if (!isLevel5OrAdmin && event.participant.id !== user.id) {
              console.log('사용자 불일치로 제외:', event.participant.id, user.id)
              return false
            }
            
            // 미보고만 표시 (reported 속성이 false이거나 없는 것)
            const isUnreported = !event.reported
            console.log('미보고 체크:', event.reported, '결과:', isUnreported)
            return isUnreported
          })
          
          console.log('필터링된 출장/외근 이벤트:', businessTripEvents)
          
          // 날짜순으로 정렬
          businessTripEvents.sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date)
            const dateB = new Date(b.start.dateTime || b.start.date)
            return dateA.getTime() - dateB.getTime()
          })
          
          setBusinessTrips(businessTripEvents)
        } else {
          setBusinessTrips([])
        }
      }
    } catch (error) {
      console.error('출장/외근 일정 로드 오류:', error)
      // 오류 발생 시에도 localStorage에서 로드 시도
      try {
        const storedEvents = localStorage.getItem('localEvents')
        if (storedEvents) {
          const allEvents: LocalEvent[] = JSON.parse(storedEvents)
          
          const businessTripEvents = allEvents.filter(event => {
            if (event.category !== '출장/외근' && event.category !== '출장' && event.category !== '외근' && event.subCategory !== '출장' && event.subCategory !== '외근') {
              return false
            }
            
            const isLevel5OrAdmin = user?.level === '5' || user?.level === 'administrator'
            if (!isLevel5OrAdmin && event.participant.id !== user?.id) {
              return false
            }
            
            return !event.reported
          })
          
          businessTripEvents.sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date)
            const dateB = new Date(b.start.dateTime || b.start.date)
            return dateA.getTime() - dateB.getTime()
          })
          
          setBusinessTrips(businessTripEvents)
        } else {
          setBusinessTrips([])
        }
      } catch (localStorageError) {
        console.error('localStorage 로드 오류:', localStorageError)
        setBusinessTrips([])
      }
    } finally {
      setLoadingTrips(false)
    }
  }, [user?.id, user?.level])

  useEffect(() => {
    loadBusinessTrips()
    loadVacationEvents()
  }, [loadBusinessTrips])

  // 연월차 일정 로드
  const loadVacationEvents = useCallback(async () => {
    if (!user?.id) return
    
    try {
      // localStorage에서 연월차 데이터 로드
      const storedEvents = localStorage.getItem('localEvents')
      if (storedEvents) {
        const allEvents: LocalEvent[] = JSON.parse(storedEvents)
        
        // 오늘 날짜
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // 연월차 카테고리만 필터링 (오늘 이후)
        const vacationEvents = allEvents.filter(event => {
          if (event.category !== '반/연차') {
            return false
          }
          
          // 레벨 5 이상이 아니면 자신의 것만
          const isLevel5OrAdmin = user?.level === '5' || user?.level === 'administrator'
          if (!isLevel5OrAdmin && event.participant.id !== user.id) {
            return false
          }
          
          // 오늘 이후 날짜만
          const eventDate = new Date(event.start.dateTime || event.start.date)
          eventDate.setHours(0, 0, 0, 0)
          
          return eventDate >= today
        })
        
        // 날짜순으로 정렬
        vacationEvents.sort((a, b) => {
          const dateA = new Date(a.start.dateTime || a.start.date)
          const dateB = new Date(b.start.dateTime || b.start.date)
          return dateA.getTime() - dateB.getTime()
        })
        
        setVacationEvents(vacationEvents)
      } else {
        setVacationEvents([])
      }
    } catch (error) {
      console.error('연월차 일정 로드 오류:', error)
      setVacationEvents([])
    }
  }, [user?.id, user?.level])

  // 프로젝트 일정 로드 (오늘 기준 3개월치)
  const loadProjectEvents = useCallback(async () => {
    if (!user?.id || user.level < 3) return
    
    setLoadingProjects(true)
    try {
      // 오늘 날짜 기준으로 3개월 범위 계산
      const today = new Date()
      const threeMonthsLater = new Date(today)
      threeMonthsLater.setMonth(today.getMonth() + 3)
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const startDate = today.toISOString().split('T')[0]
      const endDate = threeMonthsLater.toISOString().split('T')[0]
      
      // 일정 API 호출
      const response = await fetch(`/api/schedule?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        
        // 프로젝트 이벤트만 필터링
        const projectEvents: any[] = []
        
        if (data.projectEvents) {
          data.projectEvents.forEach((event: any) => {
            projectEvents.push({
              id: `project-${event.id}`,
              projectId: event.projectId,
              projectName: event.project?.projectName || '',
              projectNumber: event.project?.projectNumber || '',
              type: event.eventType,
              date: event.eventDate,
              description: event.description || ''
            })
          })
        }
        
        // 프로젝트 관리 API에서도 데이터 로드 (기존 방식 유지)
        const projectsResponse = await fetch('/api/projects')
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json()
          
          projects.forEach((project: any) => {
            // 조립완료일
            if (project.assemblyDate) {
              const assemblyDate = new Date(project.assemblyDate)
              if (assemblyDate >= today && assemblyDate <= threeMonthsLater) {
                projectEvents.push({
                  id: `assembly-${project.id}`,
                  projectId: project.id,
                  projectName: project.projectName,
                  projectNumber: project.projectNumber,
                  type: '조립완료',
                  date: project.assemblyDate,
                  description: project.description || ''
                })
              }
            }
            
            // 공장시운전일
            if (project.factoryTestDate) {
              const factoryDate = new Date(project.factoryTestDate)
              if (factoryDate >= today && factoryDate <= threeMonthsLater) {
                projectEvents.push({
                  id: `factory-${project.id}`,
                  projectId: project.id,
                  projectName: project.projectName,
                  projectNumber: project.projectNumber,
                  type: '공장시운전',
                  date: project.factoryTestDate,
                  description: project.description || ''
                })
              }
            }
            
            // 현장시운전일
            if (project.siteTestDate) {
              const siteDate = new Date(project.siteTestDate)
              if (siteDate >= today && siteDate <= threeMonthsLater) {
                projectEvents.push({
                  id: `site-${project.id}`,
                  projectId: project.id,
                  projectName: project.projectName,
                  projectNumber: project.projectNumber,
                  type: '현장시운전',
                  date: project.siteTestDate,
                  description: project.description || ''
                })
              }
            }
          })
        }
        
        // 중복 제거 (같은 프로젝트의 같은 타입)
        const uniqueEvents = projectEvents.filter((event, index, self) => 
          index === self.findIndex(e => e.projectId === event.projectId && e.type === event.type)
        )
        
        // 날짜순으로 정렬
        uniqueEvents.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })
        
        setProjectEvents(uniqueEvents)
      }
    } catch (error) {
      console.error('프로젝트 일정 로드 오류:', error)
    } finally {
      setLoadingProjects(false)
    }
  }, [user?.id, user?.level])

  useEffect(() => {
    loadProjectEvents()
  }, [loadProjectEvents])


  // 보고서 작성 모달 열기
  const handleOpenReportModal = (event: LocalEvent) => {
    setSelectedTrip(event)
    setReportModalOpen(true)
  }

  // 보고서 제출
  const handleSubmitReport = async (reportData: {
    title: string
    content: string
    attachments: string[]
  }) => {
    if (!selectedTrip || !user) return

    setSubmittingReport(true)
    try {
      // 1. 외근/출장 등록 (API 호출)
      const tripResponse = await fetch('/api/business-trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          title: selectedTrip.summary,
          purpose: selectedTrip.description || selectedTrip.summary,
          location: selectedTrip.location || '미지정',
          startDate: selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date,
          endDate: selectedTrip.end.dateTime?.split('T')[0] || selectedTrip.end.date || selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date,
          startTime: selectedTrip.start.dateTime?.split('T')[1] || null,
          endTime: selectedTrip.end.dateTime?.split('T')[1] || null
        })
      })

      if (!tripResponse.ok) {
        throw new Error('외근/출장 등록에 실패했습니다.')
      }

      const tripResult = await tripResponse.json()
      const tripId = tripResult.trip.id

      // 2. 보고서 작성
      const reportResponse = await fetch('/api/business-trip-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: tripId,
          userId: user.id,
          userName: user.name,
          title: reportData.title,
          content: reportData.content,
          attachments: reportData.attachments
        })
      })

      if (!reportResponse.ok) {
        throw new Error('보고서 작성에 실패했습니다.')
      }

      // 3. 업무일지에 보고 추가
      const workContent = `${selectedTrip.subCategory}${selectedTrip.subSubCategory ? ` - ${selectedTrip.subSubCategory}` : ''}: ${selectedTrip.summary}`
      
      const workDiaryResponse = await fetch('/api/work-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          workDate: selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date,
          projectId: 'other',
          workContent: workContent,
          workType: selectedTrip.subCategory === '출장' ? '출장' : '외근',
          workSubType: selectedTrip.subSubCategory || null,
          customProjectName: `${selectedTrip.subCategory} 업무`
        })
      })

      if (workDiaryResponse.ok) {
        // 4. 로컬 상태 업데이트
        const updatedTrips = businessTrips.map(trip => 
          trip.id === selectedTrip.id ? { ...trip, reported: true } : trip
        )
        setBusinessTrips(updatedTrips)
        
        // localStorage 업데이트
        const storedEvents = localStorage.getItem('localEvents')
        if (storedEvents) {
          const allEvents: LocalEvent[] = JSON.parse(storedEvents)
          const updatedEvents = allEvents.map(e => 
            e.id === selectedTrip.id ? { ...e, reported: true } : e
          )
          localStorage.setItem('localEvents', JSON.stringify(updatedEvents))
        }
        
        setReportModalOpen(false)
        setSelectedTrip(null)
        alert('보고서가 성공적으로 제출되었습니다.')
      } else {
        throw new Error('업무일지 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('보고서 제출 오류:', error)
      alert(`보고서 제출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setSubmittingReport(false)
    }
  }


  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 사용자 레벨 확인
  const userLevel = user.level || '1'
  const isLevel1 = userLevel === '1'
  const isLevel2 = userLevel === '2'
  const isLevel3 = userLevel === '3'
  const isLevel4 = userLevel === '4'
  const isLevel5 = userLevel === '5'
  const isAdmin = userLevel === 'administrator'

  // LEVEL1 사용자는 승인대기중 메시지 표시
  if (isLevel1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">승인대기중입니다</h2>
            <p className="text-yellow-700 mb-4">
              관리자의 승인을 기다리고 있습니다.<br />
              승인 후 시스템을 이용하실 수 있습니다.
            </p>
            <div className="text-sm text-yellow-600">
              현재 레벨: {userLevel} ({user.name}님)
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 레벨별 접근 가능한 기능 확인
  const canViewStock = isLevel2 || isLevel3 || isLevel4 || isLevel5 || isAdmin // Level2 이상에서 재고 조회 가능
  const canManageStock = isLevel3 || isLevel4 || isLevel5 || isAdmin // Level3 이상에서 재고 관리 가능
  const canDeleteStock = isLevel4 || isLevel5 || isAdmin // Level4 이상에서 재고 삭제 가능
  const canCloseStock = isLevel5 || isAdmin // Level5 이상에서 재고 마감 가능
  const canManageUsers = isLevel5 || isAdmin // Level5 이상에서 사용자 관리 가능
  const canAccessAdmin = isAdmin // Admin만 관리자 기능 접근 가능

  return (
    <div className="min-h-screen bg-white">
      <CommonHeader
        currentUser={user}
        isAdmin={user?.permissions?.includes('administrator') || false}
        title="대시보드"
        showBackButton={true}
        backUrl="/"
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-2">
            안녕하세요, {user.name}님! (Level {userLevel})
          </p>
        </div>


        {/* 출장/외근 내역과 연월차 예정 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 왼쪽: 출장/외근 내역 */}
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader className="bg-white border-b-2 border-gray-300">
              <CardTitle className="flex items-center text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center mr-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                {user && (user.level === '5' || user.level === 'administrator') 
                  ? '전체 출장/외근 내역 (미보고)' 
                  : '나의 출장/외근 내역 (미보고)'}
              </CardTitle>
          </CardHeader>
            <CardContent className="bg-gray-50">
              {loadingTrips ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">로딩 중...</p>
                </div>
              ) : businessTrips.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">출장/외근 일정이 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-2">일정 관리에서 출장/외근 일정을 등록해보세요.</p>
            </div>
              ) : (
                <div className="space-y-2">
                  {/* 헤더 */}
                  <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {user && (user.level === '5' || user.level === 'administrator') && (
                          <div className="w-20 text-xs font-semibold text-gray-800">사용자</div>
                        )}
                        <div className="w-16 text-xs font-semibold text-gray-800">구분</div>
                        <div className="w-20 text-xs font-semibold text-gray-800">세부구분</div>
                        <div className="flex-1 text-xs font-semibold text-gray-800">제목</div>
                        <div className="w-24 text-xs font-semibold text-gray-800 text-left">날짜</div>
                        <div className="w-16 text-xs font-semibold text-gray-800">상태</div>
                    </div>
                      <div className="w-20 text-xs font-semibold text-gray-800 ml-4">작업</div>
                    </div>
                  </div>
                  
                  {/* 데이터 행들 */}
                    {businessTrips.map((trip) => (
                      <div key={trip.id} className="bg-white rounded-lg p-4 border-2 border-gray-300 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {/* 구분 */}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trip.subCategory === '출장' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {trip.subCategory}
                          </span>
                          
                          {/* 세부구분 */}
                          {trip.subSubCategory && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {trip.subSubCategory}
                            </span>
                          )}
                          
                          {/* 제목 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {trip.summary}
              </div>
                            {trip.description && (
                              <div className="text-sm text-gray-600 truncate">
                                {trip.description}
              </div>
                            )}
              </div>
                          
                          {/* 날짜 */}
                          <div className="text-sm text-gray-600 whitespace-nowrap flex justify-start">
              <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(trip.start.dateTime || trip.start.date)}
              </div>
            </div>
                          
                          {/* 상태 */}
                          <div className="whitespace-nowrap">
                            {trip.reported ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                보고완료
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                미보고
                              </span>
                            )}
                </div>
              </div>
                        
                        {/* 작업 버튼 */}
                        <div className="ml-4">
                          {trip.reported ? (
              <Button 
                variant="outline" 
                size="sm" 
                              disabled
                              className="text-green-600 border-green-300"
              >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              완료
              </Button>
                          ) : (
              <Button 
                onClick={(e) => {
                  e.preventDefault()
                  handleOpenReportModal(trip)
                }}
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                              <FileText className="h-4 w-4 mr-1" />
                              보고서 작성
              </Button>
                          )}
              </div>
                </div>
                </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 오른쪽: 연월차 예정 */}
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader className="bg-white border-b-2 border-gray-300">
              <CardTitle className="flex items-center text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full flex items-center justify-center mr-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                연월차 예정 (오늘 기준 앞으로)
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-gray-50">
              <div className="space-y-2">
                {/* 헤더 */}
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-20 text-xs font-semibold text-gray-800">당사자</div>
                      <div className="w-16 text-xs font-semibold text-gray-800">구분</div>
                      <div className="flex-1 text-xs font-semibold text-gray-800">사유</div>
                      <div className="w-24 text-xs font-semibold text-gray-800">날짜</div>
                      <div className="w-16 text-xs font-semibold text-gray-800">시간</div>
                    </div>
                  </div>
                </div>
                
                {/* 연월차 데이터 표시 */}
                {vacationEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">등록된 연월차 일정이 없습니다.</p>
                    <p className="text-gray-400 text-sm mt-2">일정 관리에서 연월차를 등록해보세요.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vacationEvents.map((event) => {
                      const eventDate = new Date(event.start.dateTime || event.start.date)
                      const isToday = eventDate.toDateString() === new Date().toDateString()
                      const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
                      
                      return (
                        <div key={event.id} className={`bg-white rounded-lg p-3 border border-gray-200 ${isToday ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-20 text-sm font-medium text-gray-800 truncate">
                                {event.participant.name}
                              </div>
                              <div className="w-20 text-sm text-gray-600">
                                [{event.subCategory === '반차' 
                                  ? `반차-${event.start?.time === '09:00' ? '오전' : '오후'}`
                                  : event.subCategory || '연차'
                                }]
                              </div>
                              <div className="w-20 text-sm text-gray-600">
                                {eventDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="w-16 text-sm text-gray-600">
                                {eventDate.toLocaleDateString('ko-KR', { weekday: 'short' })}
                              </div>
                              <div className="w-16 text-sm text-gray-600">
                                {event.start.time || '종일'}
                              </div>
                            </div>
                            {isToday && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                오늘
                              </Badge>
                            )}
                            {isTomorrow && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                내일
                              </Badge>
                            )}
                          </div>
                          {event.summary && (
                            <div className="mt-2 text-sm text-gray-600 truncate">
                              {event.summary}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 프로젝트 일정 (레벨 3 이상만 표시) */}
        {user && user.level >= 3 && (
          <Card className="mb-8 bg-gray-50 border-2 border-gray-300">
              <CardHeader className="bg-white border-b-2 border-gray-300">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  프로젝트 일정 (오늘 기준 3개월)
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-gray-50">
                {loadingProjects ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">로딩 중...</p>
                  </div>
                ) : projectEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">프로젝트 일정이 없습니다.</p>
                    <p className="text-gray-400 text-sm mt-2">프로젝트 관리에서 일정을 등록해보세요.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 헤더 */}
                    <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2 text-xs font-semibold text-gray-800 text-center">구분</div>
                        <div className="col-span-7 text-xs font-semibold text-gray-800 text-center">프로젝트</div>
                        <div className="col-span-3 text-xs font-semibold text-gray-800 text-center">날짜</div>
                      </div>
                    </div>
                    
                    {/* 데이터 행들 */}
                    {projectEvents.map((event) => (
                      <div key={event.id} className="bg-white rounded-lg p-4 border-2 border-gray-300 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* 구분 */}
                          <div className="col-span-2 flex justify-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.type === '조립완료' 
                                ? 'bg-orange-100 text-orange-800' 
                                : event.type === '공장시운전'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          
                          {/* 프로젝트명 */}
                          <div className="col-span-7 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {event.projectNumber} - {event.projectName}
                            </div>
                            {event.description && (
                              <div className="text-sm text-gray-600 truncate">
                                {event.description}
                              </div>
                            )}
                          </div>
                          
                          {/* 날짜 */}
                          <div className="col-span-3 text-sm text-gray-600 whitespace-nowrap flex justify-center">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(event.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* 보고서 작성 모달 */}
        <BusinessTripReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false)
            setSelectedTrip(null)
          }}
          onSave={handleSubmitReport}
          tripData={selectedTrip ? {
            id: selectedTrip.id,
            title: selectedTrip.summary,
            purpose: selectedTrip.description || selectedTrip.summary,
            location: selectedTrip.location || '미지정',
            startDate: selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date || '',
            endDate: selectedTrip.end.dateTime?.split('T')[0] || selectedTrip.end.date || selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date || ''
          } : undefined}
          loading={submittingReport}
        />
      </div>
    </div>
  )
}
