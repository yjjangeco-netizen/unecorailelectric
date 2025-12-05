'use client'

import { useUser } from '@/hooks/useUser'
import { useAccessLog } from '@/hooks/useAccessLog'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  rejected?: boolean // 반려 여부
}

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, isAuthenticated, canAccessFeature, loading } = useUser()
  const { logPageView } = useAccessLog()
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

  // 업무일지 대기/반려 항목
  const [pendingWorkDiaries, setPendingWorkDiaries] = useState<any[]>([])
  const [loadingWorkDiaries, setLoadingWorkDiaries] = useState(false)

  // 출장 보고서 대기/반려 항목
  const [pendingTripReports, setPendingTripReports] = useState<any[]>([])
  const [loadingTripReports, setLoadingTripReports] = useState(false)


  // 로그인하지 않은 경우 홈으로 리다이렉트

  useEffect(() => {
    // 로딩이 완료된 후에만 리다이렉트 체크
    if (isAuthenticated && user) {
      // 페이지 접속 로그 기록
      logPageView('/dashboard', `Level ${user.level} 사용자 접속`)
    }
  }, [isAuthenticated, user, logPageView]);

  // 출장/외근 일정 로드
  const loadBusinessTrips = useCallback(async () => {
    if (!user?.id) return

    setLoadingTrips(true)
    try {
      // 모든 출장/외근 조회 (필터 없이)
      const apiUrl = '/api/business-trips'

      const response = await fetch(apiUrl)

      if (response.ok) {
        const data = await response.json()
        // API가 배열을 직접 반환하거나 { trips: [...] } 형태로 반환
        const trips = Array.isArray(data) ? data : (data.trips || [])
        console.log('출장/외근 데이터:', trips)

        // 레벨 5 이상은 모든 사용자의 항목, 그 외는 자신의 것만
        const isLevel5OrAdmin = String(user.level) === '5' || String(user.level).toLowerCase() === 'administrator'
        const filteredTrips = isLevel5OrAdmin
          ? trips
          : trips.filter((trip: any) => trip.user_id === user.id)

        // LocalEvent 형식으로 변환 (미보고 또는 반려된 것만 필터링)
        const formattedTrips: LocalEvent[] = filteredTrips
          .filter((trip: any) => 
            trip.report_status === 'pending' || 
            trip.report_status === 'rejected' ||
            !trip.report_status // report_status가 없는 경우도 포함
          )
          .map((trip: any) => {
            const isBusinessTrip = trip.trip_type === 'business' || trip.trip_type === 'business_trip'
            return {
              id: trip.id,
              category: '출장/외근',
              subCategory: isBusinessTrip ? '출장' : '외근',
              subSubCategory: trip.purpose || '기타',
              summary: `[${isBusinessTrip ? '출장' : '외근'}] ${trip.title}`,
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
              reported: trip.report_status === 'submitted' || trip.report_status === 'approved',
              rejected: trip.report_status === 'rejected' // 반려 여부 추가
            }
          })

        // localStorage의 businessTrips도 함께 조회
        const storedBusinessTrips = localStorage.getItem('businessTrips')
        let localStorageTrips: LocalEvent[] = []

        if (storedBusinessTrips) {
          const businessTripsData = JSON.parse(storedBusinessTrips)

          localStorageTrips = businessTripsData.map((trip: any) => {
            const isBusinessTrip = trip.trip_type === 'business' || trip.trip_type === 'business_trip'
            return {
              id: trip.id,
              category: '출장/외근',
              subCategory: isBusinessTrip ? '출장' : '외근',
              subSubCategory: trip.purpose || '기타',
              summary: `[${isBusinessTrip ? '출장' : '외근'}] ${trip.title}`,
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
            }
          })
        }

        // API 데이터와 localStorage 데이터 합치기
        const allTrips = [...formattedTrips, ...localStorageTrips]

        // DB에서 모든 이벤트 조회 (localStorage 대신)
        if (allTrips.length === 0) {
          try {
            const eventsResponse = await fetch('/api/events', {
              headers: {
                'x-user-level': String(user?.level || '1'),
                'x-user-id': user?.id || ''
              }
            })

            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json()

              const allEvents: LocalEvent[] = eventsData.map((event: any) => ({
                id: `event_${event.id}`,
                category: event.category,
                subCategory: event.sub_category,
                subSubCategory: event.sub_sub_category,
                summary: event.summary,
                description: event.description,
                start: {
                  date: event.start_date,
                  dateTime: event.start_time ? `${event.start_date}T${event.start_time}` : event.start_date
                },
                end: {
                  date: event.end_date,
                  dateTime: event.end_time ? `${event.end_date}T${event.end_time}` : event.end_date
                },
                location: event.location,
                participant: {
                  id: event.participant_id,
                  name: event.participant_name,
                  level: event.participant_level
                },
                createdBy: {
                  id: event.created_by_id,
                  name: event.created_by_name,
                  level: event.created_by_level
                },
                createdAt: event.created_at
              }))


              const businessTripEvents = allEvents.filter(event => {
                if (event.category !== '출장/외근' && event.category !== '출장' && event.category !== '외근' && event.subCategory !== '출장' && event.subCategory !== '외근') {
                  return false
                }

                const isLevel5OrAdmin = String(user?.level) === '5' || String(user?.level).toLowerCase() === 'administrator'
                if (!isLevel5OrAdmin && event.participant.id !== user?.id) {
                  return false
                }

                // reported 속성이 false이거나 없는 경우 모두 표시 (미보고로 간주)
                return !event.reported
              })

              setBusinessTrips(businessTripEvents)
            } else {
              console.error('events API 호출 실패:', eventsResponse.status)
              setBusinessTrips(allTrips)
            }
          } catch (eventsError) {
            console.error('events API 호출 오류:', eventsError)
            setBusinessTrips(allTrips)
          }
        } else {
          setBusinessTrips(allTrips)
        }
      } else {
        console.warn('출장/외근 API 실패')
        setBusinessTrips([])
      }
    } catch (error) {
      console.error('출장/외근 일정 로드 오류:', error)
      setBusinessTrips([])
    } finally {
      setLoadingTrips(false)
    }
  }, [user?.id, user?.level])

  // 연월차 일정 로드 (DB에서)
  const loadVacationEvents = useCallback(async () => {
    if (!user?.id) {
      return
    }

    try {
      // DB에서 연월차 데이터 로드
      const response = await fetch('/api/leave-requests', {
        headers: {
          'x-user-level': String(user.level || '1')
        }
      })

      if (!response.ok) {
        console.error('연월차 API 오류:', response.status)
        setVacationEvents([])
        return
      }

      const leaveRequests = await response.json()

      // 오늘 날짜
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // LocalEvent 형식으로 변환
      const vacationEvents = leaveRequests
        .filter((request: any) => {
          const eventDate = new Date(request.start_date)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate >= today
        })
        .map((request: any) => ({
          id: request.id,
          title: `${request.leave_type === 'annual' ? '연차' : '반차'} - ${request.reason || '개인사유'}`,
          start: {
            date: request.start_date,
            dateTime: request.start_time ? `${request.start_date}T${request.start_time}` : request.start_date
          },
          end: {
            date: request.end_date,
            dateTime: request.end_time ? `${request.end_date}T${request.end_time}` : request.end_date
          },
          category: '반/연차',
          participant: {
            id: request.user_id,
            name: request.user_name || 'Unknown'
          }
        }))
        .sort((a: any, b: any) => {
          const dateA = new Date(a.start.dateTime || a.start.date || new Date())
          const dateB = new Date(b.start.dateTime || b.start.date || new Date())
          return dateA.getTime() - dateB.getTime()
        })

      setVacationEvents(vacationEvents)

    } catch (error) {
      console.error('연월차 일정 로드 오류:', error)
      setVacationEvents([])
    }
  }, [user?.id, user?.level])

  // useEffect들
  useEffect(() => {
    loadBusinessTrips()
  }, [loadBusinessTrips])

  useEffect(() => {
    loadVacationEvents()
  }, [loadVacationEvents])

  // 프로젝트 일정 로드 (오늘 기준 앞뒤 1개월)
  const loadProjectEvents = useCallback(async () => {
    console.log('대시보드 프로젝트 일정 로드 시작:', { userId: user?.id, level: user?.level })
    if (!user?.id) {
      console.log('대시보드 프로젝트 일정 로드 중단: 사용자 없음')
      return
    }

    setLoadingProjects(true)
    try {
      // 오늘 날짜 기준으로 앞뒤 1개월 범위 계산
      const today = new Date()
      const oneMonthBefore = new Date(today)
      oneMonthBefore.setMonth(today.getMonth() - 1)
      const oneMonthLater = new Date(today)
      oneMonthLater.setMonth(today.getMonth() + 1)

      // 날짜를 YYYY-MM-DD 형식으로 변환
      const startDate = oneMonthBefore.toISOString().split('T')[0]
      const endDate = oneMonthLater.toISOString().split('T')[0]

      // 일정 API 호출
      const response = await fetch(`/api/schedule?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()

        // 프로젝트 이벤트만 필터링
        const projectEvents: any[] = []

        if (data.projectEvents) {
          data.projectEvents.forEach((event: any) => {
            // 날짜 범위 필터링
            if (event.eventDate) {
              const [year, month, day] = event.eventDate.split('-').map(Number)
              const eventDate = new Date(year, month - 1, day)
              if (eventDate >= oneMonthBefore && eventDate <= oneMonthLater) {
                projectEvents.push({
                  id: `project-${event.id}`,
                  projectId: event.projectId,
                  projectName: event.project?.projectName || '',
                  projectNumber: event.project?.projectNumber || '',
                  type: event.eventType,
                  date: event.eventDate,
                  description: event.description || ''
                })
              }
            }
          })
        }

        // 프로젝트 관리 API에서도 데이터 로드 (기존 방식 유지)
        const projectsResponse = await fetch('/api/projects')
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json()

          projects.forEach((project: any) => {
            // 조완일
            if (project.assembly_date) {
              const [year, month, day] = project.assembly_date.split('-').map(Number)
              const assemblyDate = new Date(year, month - 1, day)
              if (assemblyDate >= oneMonthBefore && assemblyDate <= oneMonthLater) {
                projectEvents.push({
                  id: `assembly-${project.id}`,
                  projectId: project.id,
                  projectName: project.name,
                  projectNumber: project.project_number,
                  type: '조완',
                  date: project.assembly_date,
                  description: project.description || ''
                })
              }
            }

            // 공시일
            if (project.factory_test_date) {
              const [year, month, day] = project.factory_test_date.split('-').map(Number)
              const factoryDate = new Date(year, month - 1, day)
              if (factoryDate >= oneMonthBefore && factoryDate <= oneMonthLater) {
                projectEvents.push({
                  id: `factory-${project.id}`,
                  projectId: project.id,
                  projectName: project.name,
                  projectNumber: project.project_number,
                  type: '공시',
                  date: project.factory_test_date,
                  description: project.description || ''
                })
              }
            }

            // 현시일
            if (project.site_test_date) {
              const [year, month, day] = project.site_test_date.split('-').map(Number)
              const siteDate = new Date(year, month - 1, day)
              if (siteDate >= oneMonthBefore && siteDate <= oneMonthLater) {
                projectEvents.push({
                  id: `site-${project.id}`,
                  projectId: project.id,
                  projectName: project.name,
                  projectNumber: project.project_number,
                  type: '현시',
                  date: project.site_test_date,
                  description: project.description || ''
                })
              }
            }
          })
        }

        // 중복 제거 (같은 프로젝트명 + 같은 타입 + 같은 날짜)
        const uniqueEvents = projectEvents.filter((event, index, self) =>
          index === self.findIndex(e => 
            e.projectName === event.projectName && 
            e.type === event.type && 
            e.date === event.date
          )
        )

        // 최종 날짜 범위 필터링 (확실하게)
        const filteredEvents = uniqueEvents.filter(event => {
          if (!event.date) return false
          const [year, month, day] = event.date.split('-').map(Number)
          const eventDate = new Date(year, month - 1, day)
          return eventDate >= oneMonthBefore && eventDate <= oneMonthLater
        })

        // 날짜순으로 정렬
        filteredEvents.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })

        setProjectEvents(filteredEvents)
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

  // 업무일지 대기/반려 항목 로드
  // - Level 5/Admin: 모든 사용자의 대기/반려 항목 전체
  // - 일반 사용자: 본인의 대기/반려 항목
  const loadPendingWorkDiaries = useCallback(async () => {
    if (!user?.id) return

    setLoadingWorkDiaries(true)
    try {
      const level = String(user.level || '').toLowerCase()
      const isAdminUser = level === '5' || level === 'administrator' || level === 'admin' || user.id === 'admin'
      
      // 관리자는 전체 조회, 일반 사용자는 본인 것만
      const queryParams = new URLSearchParams()
      queryParams.append('userLevel', String(user.level))
      if (!isAdminUser) {
        queryParams.append('userId', user.id)
      }
      
      const response = await fetch(`/api/work-diary?${queryParams.toString()}`, {
        headers: {
          'x-user-id': user.id,
          'x-user-level': String(user.level)
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const allDiaries = data.data || []
        
        // 필터링: 대기(pending, null) 또는 반려(rejected) 상태
        // 관리자는 전체, 일반 사용자는 본인 것만
        const filtered = allDiaries.filter((diary: any) => {
          const isPendingOrRejected = diary.approvalStatus === 'rejected' || 
                                       diary.approvalStatus === 'pending' || 
                                       !diary.approvalStatus
          
          if (isAdminUser) {
            return isPendingOrRejected
          }
          // 일반 사용자: 본인의 대기/반려 항목
          return diary.userId === user.id && isPendingOrRejected
        })
        
        // 같은 날짜 + 같은 사용자로 그룹화
        const grouped = filtered.reduce((acc: any[], diary: any) => {
          const key = `${diary.workDate}_${diary.userId}`
          const existing = acc.find(g => g.key === key)
          if (existing) {
            existing.count++
            existing.items.push(diary)
          } else {
            acc.push({
              key,
              ...diary,
              count: 1,
              items: [diary]
            })
          }
          return acc
        }, [])
        
        setPendingWorkDiaries(grouped.slice(0, 20)) // 최대 20개
      }
    } catch (error) {
      console.error('업무일지 로드 오류:', error)
    } finally {
      setLoadingWorkDiaries(false)
    }
  }, [user?.id, user?.level])

  // 출장 보고서 대기 항목 로드
  // - Level 5/Admin: 모든 사용자의 승인 대기 항목
  // - 일반 사용자: 본인의 승인 대기 항목
  const loadPendingTripReports = useCallback(async () => {
    if (!user?.id) return

    setLoadingTripReports(true)
    try {
      const level = String(user.level || '').toLowerCase()
      const isAdminUser = level === '5' || level === 'administrator' || level === 'admin' || user.id === 'admin'
      
      const response = await fetch('/api/business-trip-reports', {
        headers: {
          'x-user-id': user.id,
          'x-user-level': String(user.level)
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const reports = data.reports || data || []
        
        // 제출됨(submitted) 상태 필터링 (승인 대기)
        // 관리자는 전체, 일반 사용자는 본인 것만
        const pending = reports.filter((report: any) => {
          const isPending = report.status === 'submitted'
          if (isAdminUser) {
            return isPending
          }
          // 일반 사용자: 본인이 제출한 것만
          return isPending && (report.user_id === user.id || report.business_trips?.user_id === user.id)
        })
        
        setPendingTripReports(pending.slice(0, 10)) // 최대 10개만
      }
    } catch (error) {
      console.error('출장 보고서 로드 오류:', error)
    } finally {
      setLoadingTripReports(false)
    }
  }, [user?.id, user?.level])

  useEffect(() => {
    loadPendingWorkDiaries()
    loadPendingTripReports()
  }, [loadPendingWorkDiaries, loadPendingTripReports])


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
      let tripId = selectedTrip.id

      // 1. 기존 출장/외근의 report_status 업데이트
      const updateResponse = await fetch(`/api/business-trips/${tripId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_status: 'submitted'
        })
      })

      if (!updateResponse.ok) {
        // 기존 출장이 없으면 새로 생성
        const tripResponse = await fetch('/api/business-trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            user_name: user.name,
            title: selectedTrip.summary,
            purpose: selectedTrip.description || selectedTrip.summary,
            location: selectedTrip.location || '미지정',
            start_date: selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date,
            end_date: selectedTrip.end.dateTime?.split('T')[0] || selectedTrip.end.date || selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date,
            start_time: selectedTrip.start.dateTime?.split('T')[1] || null,
            end_time: selectedTrip.end.dateTime?.split('T')[1] || null,
            trip_type: selectedTrip.subCategory === '출장' ? 'business_trip' : 'field_work',
            report_status: 'submitted'
          })
        })

        if (!tripResponse.ok) {
          throw new Error('외근/출장 등록에 실패했습니다.')
        }

        const tripResult = await tripResponse.json()
        tripId = tripResult.trip?.id || tripResult.id
      }

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

      // 3. 로컬 상태에서 해당 항목 제거 (보고 완료)
      const updatedTrips = businessTrips.filter(trip => trip.id !== selectedTrip.id)
      setBusinessTrips(updatedTrips)

      // localStorage 업데이트
      const storedEvents = localStorage.getItem('localEvents')
      if (storedEvents) {
        const allEvents: LocalEvent[] = JSON.parse(storedEvents)
        const updatedEvents = allEvents.filter(e => e.id !== selectedTrip.id)
        localStorage.setItem('localEvents', JSON.stringify(updatedEvents))
      }

      setReportModalOpen(false)
      setSelectedTrip(null)
      alert('보고서가 성공적으로 제출되었습니다.')
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


  // 사용자 정보가 없으면 로딩 표시
  if (!user) {
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
  const levelLower = String(userLevel).toLowerCase()
  const isAdmin = levelLower === 'administrator' || levelLower === 'admin' || user.id === 'admin'
  const isLevel5OrAdmin = isLevel5 || isAdmin

  return (
    <AuthGuard requiredLevel={3}>
      <div className="min-h-screen bg-white">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7] min-h-screen">
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Gradient Banner Header */}

          {/* 승인 대기/반려 섹션 (관리자: 모든 항목, 일반사용자: 본인 대기/반려 항목) */}
          {(pendingWorkDiaries.length > 0 || pendingTripReports.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 업무일지 승인 대기 */}
              {pendingWorkDiaries.length > 0 && (
                <Card className="bg-white rounded-2xl border border-orange-200 shadow-lg overflow-hidden border-t-4 border-t-orange-500">
                  <CardHeader className="px-6 py-4 border-b border-orange-100 bg-orange-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {isLevel5OrAdmin ? '업무일지 승인 대기' : '내 업무일지 승인 현황'}
                          </h3>
                          <p className="text-orange-600 text-sm">{pendingWorkDiaries.length}건 처리 필요</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => router.push('/work-diary/history')}
                      >
                        전체보기
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                    {loadingWorkDiaries ? (
                      <div className="p-6 text-center text-gray-500">로딩 중...</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {pendingWorkDiaries.map((diary) => (
                          <div key={diary.key || diary.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push('/work-diary/history')}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">{diary.user?.name || '알 수 없음'}</span>
                                  <Badge className={diary.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                                    {diary.approvalStatus === 'rejected' ? '반려됨' : '대기'}
                                  </Badge>
                                  {diary.count > 1 && (
                                    <span className="text-xs text-gray-500">외 {diary.count - 1}건</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 truncate max-w-[300px]">{diary.workContent}</p>
                                <p className="text-xs text-gray-400 mt-1">{diary.workDate}</p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 출장 보고서 승인 대기 */}
              {pendingTripReports.length > 0 && (
                <Card className="bg-white rounded-2xl border border-purple-200 shadow-lg overflow-hidden border-t-4 border-t-purple-500">
                  <CardHeader className="px-6 py-4 border-b border-purple-100 bg-purple-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <MapPin className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {isLevel5OrAdmin ? '출장 보고서 승인 대기' : '내 출장 보고서 승인 현황'}
                          </h3>
                          <p className="text-purple-600 text-sm">{pendingTripReports.length}건 처리 필요</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-purple-600 border-purple-300 hover:bg-purple-50"
                        onClick={() => router.push('/business-trip-reports')}
                      >
                        전체보기
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                    {loadingTripReports ? (
                      <div className="p-6 text-center text-gray-500">로딩 중...</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {pendingTripReports.map((report) => (
                          <div key={report.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/business-trip-reports/${report.id}`)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">{report.business_trips?.user_name || '알 수 없음'}</span>
                                  <Badge className="bg-blue-100 text-blue-700">제출됨</Badge>
                                </div>
                                <p className="text-sm text-gray-800 font-medium">{report.title}</p>
                                <p className="text-xs text-gray-400 mt-1">{report.business_trips?.location} | {new Date(report.submitted_at).toLocaleDateString()}</p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 출장/외근 내역과 연월차 예정 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 왼쪽: 출장/외근 내역 */}
            <Card className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden h-full flex flex-col border-t-4 border-t-blue-500">
              <CardHeader className="px-8 py-6 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {user && (String(user.level) === '5' || String(user.level).toLowerCase() === 'administrator')
                        ? '전체 출장/외근 (미보고/반려)'
                        : '내 출장/외근 (미보고/반려)'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">출장/외근을 관리하고 보고서를 작성하세요</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="w-[100px]">구분</TableHead>
                          <TableHead>내용</TableHead>
                          <TableHead>날짜</TableHead>
                          <TableHead className="text-right">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businessTrips.map((trip) => (
                          <TableRow key={trip.id} className="hover:bg-blue-50/30 transition-colors">
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                                  trip.subCategory === '출장'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {trip.subCategory}
                                </span>
                                {trip.subSubCategory && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    {trip.subSubCategory}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{trip.summary}</span>
                                {trip.description && (
                                  <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {trip.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                {formatDate(trip.start.dateTime || trip.start.date)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {trip.reported ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  완료
                                </span>
                              ) : trip.rejected ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    반려됨
                                  </span>
                                  {/* 재작성 버튼 - 본인 신청건만 */}
                                  {trip.participant?.id === user?.id && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        handleOpenReportModal(trip)
                                      }}
                                      className="h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 rounded-lg"
                                    >
                                      재작성
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                /* 보고서 작성 버튼 - 본인 신청건만 */
                                trip.participant?.id === user?.id ? (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleOpenReportModal(trip)
                                    }}
                                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 rounded-lg"
                                  >
                                    보고서 작성
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">신청자만 가능</span>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 오른쪽: 연월차 예정 */}
            <Card className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden h-full flex flex-col border-t-4 border-t-emerald-500">
              <CardHeader className="px-8 py-6 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">연월차 예정</h2>
                    <p className="text-gray-500 text-sm mt-1">오늘 이후 예정된 연/월차</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="overflow-x-auto">
                  {vacationEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium text-lg">예정된 연월차가 없습니다</p>
                      <p className="text-gray-500 text-sm mt-1">오늘도 화이팅!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="w-[80px]">구분</TableHead>
                          <TableHead>이름</TableHead>
                          <TableHead>날짜</TableHead>
                          <TableHead className="text-right">상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vacationEvents.map((event) => {
                          const eventDate = new Date(event.start.dateTime || event.start.date || new Date())
                          const isToday = eventDate.toDateString() === new Date().toDateString()
                          const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()

                          return (
                            <TableRow key={event.id} className={`hover:bg-emerald-50/30 transition-colors ${isToday ? 'bg-emerald-50/20' : ''}`}>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  event.subCategory === '반차' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {event.subCategory || '연차'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{event.participant.name}</span>
                                  <span className="text-xs text-gray-500">{event.summary || '개인사유'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">
                                  {eventDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({eventDate.toLocaleDateString('ko-KR', { weekday: 'short' })})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {isToday && <span className="inline-flex px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">TODAY</span>}
                                {isTomorrow && <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">TOMORROW</span>}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 프로젝트 일정 (로그인 사용자만 표시) */}
          {user && (
            <Card className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden mb-8 border-t-4 border-t-purple-500">
              <CardHeader className="px-8 py-6 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-2xl">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">프로젝트 일정</h2>
                    <p className="text-gray-500 text-sm mt-1">오늘 기준 앞뒤 1개월 일정</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingProjects ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">일정 로딩 중...</p>
                  </div>
                ) : projectEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium text-lg">예정된 프로젝트가 없습니다</p>
                    <p className="text-gray-500 text-sm mt-1">프로젝트 관리에서 일정을 추가하세요</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="w-[100px]">유형</TableHead>
                          <TableHead>프로젝트</TableHead>
                          <TableHead>날짜</TableHead>
                          <TableHead className="text-right">설명</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectEvents.map((event) => (
                          <TableRow key={event.id} className="hover:bg-purple-50/30 transition-colors group">
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                event.type === '조완'
                                  ? 'bg-orange-100 text-orange-700'
                                  : event.type === '공시'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                              }`}>
                                {event.type}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                  {event.projectName}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                  {event.projectNumber}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                {formatDate(event.date)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {event.description && (
                                <span className="text-xs text-gray-500 truncate max-w-[300px] inline-block">
                                  {event.description}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 보고서 작성 모달 */}
          {selectedTrip && (
            <BusinessTripReportModal
              isOpen={reportModalOpen}
              onClose={() => {
                setReportModalOpen(false)
                setSelectedTrip(null)
              }}
              onSave={handleSubmitReport}
              tripData={{
                id: selectedTrip.id,
                title: selectedTrip.summary,
                purpose: selectedTrip.description || selectedTrip.summary,
                location: selectedTrip.location || '미지정',
                startDate: selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date || '',
                endDate: selectedTrip.end.dateTime?.split('T')[0] || selectedTrip.end.date || selectedTrip.start.dateTime?.split('T')[0] || selectedTrip.start.date || ''
              }}
              loading={submittingReport}
            />
          )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
