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
        const trips = data.trips || []

        // 레벨 5 이상은 모든 사용자의 항목, 그 외는 자신의 것만
        const isLevel5OrAdmin = String(user.level) === '5' || String(user.level).toLowerCase() === 'administrator'
        const filteredTrips = isLevel5OrAdmin
          ? trips
          : trips.filter((trip: any) => trip.user_id === user.id)

        // LocalEvent 형식으로 변환
        const formattedTrips: LocalEvent[] = filteredTrips.map((trip: any) => ({
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
          reported: false // 기본적으로 미보고로 설정
        }))

        // localStorage의 businessTrips도 함께 조회
        const storedBusinessTrips = localStorage.getItem('businessTrips')
        let localStorageTrips: LocalEvent[] = []

        if (storedBusinessTrips) {
          const businessTripsData = JSON.parse(storedBusinessTrips)

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

  // 프로젝트 일정 로드 (오늘 기준 3개월치)
  const loadProjectEvents = useCallback(async () => {
    console.log('대시보드 프로젝트 일정 로드 시작:', { userId: user?.id, level: user?.level })
    console.log('레벨 체크:', {
      isAdmin: String(user?.level).toLowerCase() === 'administrator',
      numericLevel: parseInt(String(user?.level || '0')),
      condition: String(user?.level).toLowerCase() !== 'administrator' && parseInt(String(user?.level || '0')) < 1,
      userLevel: user?.level,
      userId: user?.id
    })
    if (!user?.id) {
      console.log('대시보드 프로젝트 일정 로드 중단: 사용자 없음')
      return
    }

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
            // 조완일
            if (project.assembly_date) {
              const [year, month, day] = project.assembly_date.split('-').map(Number)
              const assemblyDate = new Date(year, month - 1, day)
              if (assemblyDate >= today && assemblyDate <= threeMonthsLater) {
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
              if (factoryDate >= today && factoryDate <= threeMonthsLater) {
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
              if (siteDate >= today && siteDate <= threeMonthsLater) {
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
  const isAdmin = String(userLevel).toLowerCase() === 'administrator'

  return (
    <AuthGuard requiredLevel={3}>
      <div className="min-h-screen bg-white">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7] min-h-screen">
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Gradient Banner Header */}


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
                        ? 'All Business Trips (Unreported)'
                        : 'My Business Trips (Unreported)'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your business trips and reports</p>
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
                          <TableHead className="w-[100px]">State</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
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
                              ) : (
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
                    <h2 className="text-xl font-bold text-gray-900">Upcoming Leaves</h2>
                    <p className="text-gray-500 text-sm mt-1">Scheduled leaves from today onwards</p>
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
                      <p className="text-gray-900 font-medium text-lg">No upcoming leaves</p>
                      <p className="text-gray-500 text-sm mt-1">Enjoy your work!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="w-[80px]">Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Status</TableHead>
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
                    <h2 className="text-xl font-bold text-gray-900">Project Schedule</h2>
                    <p className="text-gray-500 text-sm mt-1">Upcoming project milestones (3 months)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingProjects ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading schedule...</p>
                  </div>
                ) : projectEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium text-lg">No upcoming projects</p>
                    <p className="text-gray-500 text-sm mt-1">Add schedules in Project Management</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Description</TableHead>
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
