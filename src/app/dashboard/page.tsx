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
  ChevronDown,
  ChevronUp,
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
  const [projectSchedule, setProjectSchedule] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

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

  // 누락된 업무보고 항목
  const [missingWorkDiaries, setMissingWorkDiaries] = useState<any[]>([])
  const [loadingMissingDiaries, setLoadingMissingDiaries] = useState(false)

  // 닷시보드 리스트 펼치기 상태
  const [expandMissingDiaries, setExpandMissingDiaries] = useState(false)
  const [expandMissingTrips, setExpandMissingTrips] = useState(false)
  const [expandPending, setExpandPending] = useState(false)
  const [expandLeave, setExpandLeave] = useState(false)
  const [expandProjectSchedule, setExpandProjectSchedule] = useState(false)

  const loadMissingWorkDiaries = useCallback(async () => {
    if (!user?.id) return
    setLoadingMissingDiaries(true)
    try {
      const response = await fetch(`/api/work-diary/missing?userId=${user.id}&userLevel=${user.level}`)
      if (response.ok) {
        const result = await response.json()
        setMissingWorkDiaries(result.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMissingDiaries(false)
    }
  }, [user])

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

          // API에서 이미 완료된(submitted/approved) 것으로 확인된 항목은 제외
          // 더 강력한 조치: 서버 ID(temp_로 시작하지 않는 것)를 가진 항목은 LocalStorage에서 무시하고 API 데이터만 신뢰
          // 이렇게 하면 로컬에 남아있는 "좀비" 데이터를 확실히 제거할 수 있음

          localStorageTrips = businessTripsData
            .filter((trip: any) => String(trip.id).startsWith('temp_'))
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
                reported: trip.report_status === 'submitted'
              }
            })
        }

        // API 데이터와 localStorage 데이터 합치기
        // 중복 제거를 위해 Map 사용 (ID 기준)
        const combinedMap = new Map<string, LocalEvent>();

        // 1. LocalStorage 데이터 먼저 넣기
        localStorageTrips.forEach(trip => combinedMap.set(String(trip.id), trip));

        // 2. API 데이터 덮어쓰기 (API가 더 최신/정확)
        formattedTrips.forEach(trip => combinedMap.set(String(trip.id), trip));

        const allTrips = Array.from(combinedMap.values());

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

                // 이미 등록된 출장/외근 데이터(trips)와 중복되는지 확인
                // 날짜와 사용자, 그리고 제목이 유사하면 중복으로 간주하고 숨김
                if (trips && trips.length > 0) {
                  const eventDate = event.start.date || event.start.dateTime?.split('T')[0]
                  const normalize = (s: string) => s ? s.replace(/\[.*?\]/g, '').replace(/\s+/g, '').trim().toLowerCase() : ''

                  const isDuplicate = trips.some((trip: any) => {
                    // 사용자 불일치
                    if (String(trip.user_id) !== String(event.participant.id)) return false

                    // 날짜 불일치
                    const tripDate = trip.start_date
                    if (tripDate !== eventDate) return false

                    // [강력한 중복 제거]
                    // 같은 날짜, 같은 사용자의 출장/외근 데이터가 'trips'에 존재하면
                    // 무조건 generic event는 숨김 (trips API가 더 구체적이고 정확함)
                    // 제목이 달라도 숨김 처리 (같은 날 두 건의 출장이 있을 수 있지만, 보통은 API 중복임)
                    return true
                  })

                  if (isDuplicate) return false
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

  // 프로젝트 일정 로드 (오늘 기준 남은 전체 일정)
  const fetchProjectSchedule = useCallback(async () => {
    console.log('대시보드 프로젝트 일정 로드 시작:', { userId: user?.id, level: user?.level })
    if (!user?.id) {
      console.log('대시보드 프로젝트 일정 로드 중단: 사용자 없음')
      return
    }

    setLoadingSchedule(true)
    try {
      // 오늘 날짜 (시간 00:00:00으로 설정)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 일정 API 호출 (모든 일정 가져옴)
      const response = await fetch(`/api/schedule`)
      if (response.ok) {
        const data = await response.json()

        // 프로젝트 이벤트만 필터링
        const scheduleEvents: any[] = []

        if (data.projectEvents) {
          data.projectEvents.forEach((event: any) => {
            // 날짜 범위 필터링 (오직 미래 일정만)
            if (event.eventDate) {
              const [year, month, day] = event.eventDate.split('-').map(Number)
              const eventDate = new Date(year, month - 1, day)

              // 오늘 이후 일정만 포함 그리고 '준공'은 제외
              if (eventDate >= today && event.eventType !== '준공') {
                scheduleEvents.push({
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

        // 프로젝트 관리 API 호출 로직 제거 (중복 발생 원인)
        // api/schedule에서 이미 프로젝트 일정을 포함해서 반환하므로 여기서 다시 추가할 필요가 없음


        // 필터링: 프로젝트 이름이 없는 유령 데이터 제거
        const validEvents = scheduleEvents.filter(e => e.projectName && e.projectName.trim() !== '')

        // 중복 제거 (projectNumber + type이 같으면 하나만 유지)
        // DB에 중복된 프로젝트가 있어도 번호가 같으면 하나로 합침
        const eventMap = new Map()

        validEvents.forEach(e => {
          // Normalization specifically for deduplication
          // 날짜, 타입, 프로젝트 번호를 정규화해서 키 생성
          const dateKey = String(e.date || '').trim()
          const typeKey = String(e.type || '').trim()

          // projectNumber 우선 사용, 없으면 projectId, 그것도 없으면 이름 사용
          let idBase = e.projectNumber ? String(e.projectNumber) : (e.projectId ? String(e.projectId) : e.projectName)
          idBase = String(idBase || '').trim()

          // 키: 날짜-타입-식별자
          const key = `${dateKey}-${typeKey}-${idBase}`

          if (eventMap.has(key)) {
            const existing = eventMap.get(key)

            // 우선순위 결정 로직: 정보가 더 많은 쪽을 선택
            // 1. 프로젝트 이름이 '제대로' 된 것 (번호와 다른 것)
            const candHasRealName = e.projectName && e.projectName.trim() !== e.projectNumber
            const currHasRealName = existing.projectName && existing.projectName.trim() !== existing.projectNumber

            if (candHasRealName && !currHasRealName) {
              eventMap.set(key, e)
              return
            }
            if (!candHasRealName && currHasRealName) return

            // 2. 설명(description)이 있는 것
            if (e.description && !existing.description) {
              eventMap.set(key, e)
              return
            }
            if (!e.description && existing.description) return

            // 3. 이름 길이가 더 긴 것
            if ((e.projectName?.length || 0) > (existing.projectName?.length || 0)) {
              eventMap.set(key, e)
            }
          } else {
            eventMap.set(key, e)
          }
        })

        const uniqueEvents = Array.from(eventMap.values())

        // 최종 날짜 범위 필터링 (확실하게, 미래 일정만)
        const filteredEvents = uniqueEvents.filter(event => {
          if (!event.date) return false
          const [year, month, day] = event.date.split('-').map(Number)
          const eventDate = new Date(year, month - 1, day)
          return eventDate >= today
        })

        // 날짜순으로 정렬
        filteredEvents.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })

        setProjectSchedule(filteredEvents)
      }
    } catch (error) {
      console.error('프로젝트 일정 로드 오류:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }, [user?.id, user?.level])

  useEffect(() => {
    fetchProjectSchedule()
  }, [fetchProjectSchedule])

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
    loadMissingWorkDiaries()
    loadPendingWorkDiaries()
    loadPendingTripReports()
  }, [loadMissingWorkDiaries, loadPendingWorkDiaries, loadPendingTripReports])


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
          <div className="flex-1 overflow-auto p-2 sm:p-4 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
              <div className="space-y-6">
                {/* 1. 누락된 업무보고 */}
                <Card className="bg-white rounded-2xl border border-orange-200 shadow-md">
                  <CardHeader className="p-3 sm:px-4 sm:py-3 border-b border-orange-100 bg-orange-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <FileText className="h-5 w-5 text-orange-600" />
                         <h3 className="text-base font-bold text-gray-900">
                           누락된 업무보고 {missingWorkDiaries.length > 0 && <span className="text-orange-600 font-black ml-1">{missingWorkDiaries.length}건</span>}
                         </h3>
                      </div>
                      <button onClick={() => setExpandMissingDiaries(!expandMissingDiaries)} className="p-1 rounded-lg hover:bg-orange-100 transition-colors" title={expandMissingDiaries ? '접기' : '펼치기'}>
                        {expandMissingDiaries ? <ChevronUp className="h-5 w-5 text-orange-500" /> : <ChevronDown className="h-5 w-5 text-orange-500" />}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0" style={{ display: expandMissingDiaries ? '' : 'none' }}>
                    {missingWorkDiaries.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">누락된 업무보고가 없습니다. 완벽합니다!</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {missingWorkDiaries.map((diary, i) => (
                          <div key={i} className="p-3 hover:bg-orange-50/30 flex justify-between items-center text-sm">
                            <div>
                               <span className="font-bold text-gray-800">{diary.department} {diary.userName}</span>
                               <span className="text-gray-500 ml-2">{diary.date}</span>
                            </div>
                            {diary.userId === user?.id && (
                              <Button size="sm" className="h-7 text-[11px] bg-orange-600 hover:bg-orange-700 text-white rounded-md px-3" onClick={() => router.push(`/work-diary/write?date=${diary.date}`)}>작성하기</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. 누락된 출장/외근 보고 */}
                <Card className="bg-white rounded-2xl border border-blue-200 shadow-md">
                  <CardHeader className="p-3 sm:px-4 sm:py-3 border-b border-blue-100 bg-blue-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <MapPin className="h-5 w-5 text-blue-600" />
                         <h3 className="text-base font-bold text-gray-900">
                           누락된 출장/외근 보고 {businessTrips.length > 0 && <span className="text-blue-600 font-black ml-1">{businessTrips.length}건</span>}
                         </h3>
                      </div>
                      <button onClick={() => setExpandMissingTrips(!expandMissingTrips)} className="p-1 rounded-lg hover:bg-blue-100 transition-colors" title={expandMissingTrips ? '접기' : '펼치기'}>
                        {expandMissingTrips ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0" style={{ display: expandMissingTrips ? '' : 'none' }}>
                    {businessTrips.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">누락된 출장/외근 보고가 없습니다.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {businessTrips.map((trip) => (
                          <div key={trip.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors flex justify-between items-center text-sm gap-2">
                            <div className="flex flex-col min-w-0">
                               <div className="flex items-center gap-2">
                                 <span className="font-bold text-gray-800 shrink-0">{trip.participant.name}</span>
                                 <span className="text-blue-600 font-bold text-[11px] bg-blue-100 px-1.5 py-0.5 rounded shrink-0">{trip.subCategory}</span>
                                 <span className="text-gray-900 truncate">{trip.summary}</span>
                               </div>
                               <span className="text-gray-500 text-xs mt-0.5">{formatDate(trip.start.dateTime || trip.start.date)}</span>
                            </div>
                            {trip.participant.id === user?.id && (
                              <Button size="sm" onClick={(e) => { e.preventDefault(); handleOpenReportModal(trip) }} className="h-7 text-[11px] px-3 bg-blue-600 hover:bg-blue-700 rounded-md shrink-0">보고 작성</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. 승인 대기 내역 */}
                <Card className="bg-white rounded-2xl border border-rose-200 shadow-md">
                  <CardHeader className="p-3 sm:px-4 sm:py-3 border-b border-rose-100 bg-rose-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <CheckCircle className="h-5 w-5 text-rose-600" />
                         <h3 className="text-base font-bold text-gray-900">
                           결재 승인 대기 {(pendingWorkDiaries.length + pendingTripReports.length) > 0 && <span className="text-rose-600 font-black ml-1">{pendingWorkDiaries.length + pendingTripReports.length}건</span>}
                         </h3>
                      </div>
                      <button onClick={() => setExpandPending(!expandPending)} className="p-1 rounded-lg hover:bg-rose-100 transition-colors" title={expandPending ? '접기' : '펼치기'}>
                        {expandPending ? <ChevronUp className="h-5 w-5 text-rose-500" /> : <ChevronDown className="h-5 w-5 text-rose-500" />}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0" style={{ display: expandPending ? '' : 'none' }}>
                    {(pendingWorkDiaries.length === 0 && pendingTripReports.length === 0) ? (
                      <div className="text-center py-6 text-gray-500 text-sm">결재 대기 중인 문서가 없습니다.</div>
                    ) : (
                      <div className="flex-col">
                        <div className="divide-y divide-gray-100">
                          {(() => {
                            const allPending = [
                              ...pendingWorkDiaries.map(d => ({ ...d, _type: 'diary' })),
                              ...pendingTripReports.map(r => ({ ...r, _type: 'trip' }))
                            ];

                            return allPending.map((item: any, idx: number) => {
                              if (item._type === 'diary') {
                                return (
                                  <div key={`wd-${idx}`} className="p-3 hover:bg-rose-50/20 text-sm flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <span className="text-rose-600 font-bold text-[11px] bg-rose-100 w-fit px-1.5 py-0.5 rounded mb-0.5">업무일지</span>
                                      <span className="font-bold text-gray-800">{item.user?.department} {item.user?.name} · {item.workDate}</span>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => router.push('/work-diary/history')}>상세보기</Button>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={`tr-${idx}`} className="p-3 hover:bg-rose-50/20 text-sm flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <span className="text-rose-600 font-bold text-[11px] bg-rose-100 w-fit px-1.5 py-0.5 rounded mb-0.5">출장보고</span>
                                      <span className="font-bold text-gray-800">{item.user_name} · {item.title}</span>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => router.push('/work-diary/history')}>상세보기</Button>
                                  </div>
                                );
                              }
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* 연차/월차 예정 */}
                <Card className="bg-white rounded-2xl border border-emerald-200 shadow-md">
                  <CardHeader className="p-3 sm:px-4 sm:py-3 border-b border-emerald-100 bg-emerald-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Calendar className="h-5 w-5 text-emerald-600" />
                         <h3 className="text-base font-bold text-gray-900">
                           연차/월차 예정 {vacationEvents.length > 0 && <span className="text-emerald-600 font-black ml-1">{vacationEvents.length}건</span>}
                         </h3>
                      </div>
                      <button onClick={() => setExpandLeave(!expandLeave)} className="p-1 rounded-lg hover:bg-emerald-100 transition-colors" title={expandLeave ? '접기' : '펼치기'}>
                        {expandLeave ? <ChevronUp className="h-5 w-5 text-emerald-500" /> : <ChevronDown className="h-5 w-5 text-emerald-500" />}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0" style={{ display: expandLeave ? '' : 'none' }}>
                    {vacationEvents.length === 0 ? (
                      <div className="text-center py-10 text-gray-500 text-sm">예정된 연차/월차가 없습니다.</div>
                    ) : (
                      <div>
                        {vacationEvents.map((event) => {
                          const eventDate = new Date(event.start.dateTime || event.start.date || new Date())
                          const isToday = eventDate.toDateString() === new Date().toDateString()
                          const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
                          return (
                            <div key={event.id} className={`p-4 border-b border-gray-100 last:border-0 flex items-center justify-between transition-colors ${isToday ? 'bg-emerald-50/20' : 'hover:bg-gray-50'}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs shadow-sm">
                                  {event.participant.name.substring(0, 1)}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 text-sm">{event.participant.name}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${event.subCategory === '반차' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {event.subCategory || '연차'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {eventDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })} · {event.summary || '개인사유'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                {isToday && <span className="inline-flex px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold rounded-md">TODAY</span>}
                                {isTomorrow && <span className="inline-flex px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold rounded-md">내일</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* 프로젝트 일정 (로그인 사용자만 표시) */}
                {user && (
                  <Card className="bg-white rounded-2xl border border-purple-200 shadow-md">
                    <CardHeader className="p-3 sm:px-4 sm:py-3 border-b border-purple-100 bg-purple-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BarChart3 className="h-5 w-5 text-purple-600" />
                           <h3 className="text-base font-bold text-gray-900">
                             프로젝트 일정 {projectSchedule.filter(e => e.projectName).length > 0 && <span className="text-purple-600 font-black ml-1">{projectSchedule.filter(e => e.projectName).length}건</span>}
                           </h3>
                        </div>
                        <button onClick={() => setExpandProjectSchedule(!expandProjectSchedule)} className="p-1 rounded-lg hover:bg-purple-100 transition-colors" title={expandProjectSchedule ? '접기' : '펼치기'}>
                          {expandProjectSchedule ? <ChevronUp className="h-5 w-5 text-purple-500" /> : <ChevronDown className="h-5 w-5 text-purple-500" />}
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0" style={{ display: expandProjectSchedule ? '' : 'none' }}>
                    {loadingSchedule ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">일정 로딩 중...</p>
                      </div>
                    ) : projectSchedule.filter(e => e.projectName).length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-900 font-medium text-lg">예정된 프로젝트가 없습니다</p>
                        <p className="text-gray-500 text-sm mt-1">프로젝트 관리에서 일정을 추가하세요</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-gray-100 p-2 bg-gray-50/50">
                            {projectSchedule.map((event) => (
                                <div key={event.id} className="p-4 m-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
                                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner ${
                                    event.type === '조완' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                    event.type === '공시' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    'bg-purple-50 text-purple-600 border border-purple-100'
                                  }`}>
                                    {event.type}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors">{event.projectName}</h3>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                      {formatDate(event.date)}
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-mono mt-1 bg-gray-50 px-1.5 py-0.5 rounded w-fit">{event.projectNumber}</span>
                                  </div>
                                </div>
                            ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
              </div>

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
