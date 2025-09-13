'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import CommonHeader from '@/components/CommonHeader'
// 로컬 이벤트 타입 정의
interface LocalEvent {
  id: string
  category: string
  subCategory?: string // 출장/외근, 반차/연차 구분
  subSubCategory?: string // 출장 세부구분 (시운전, 현장답사, 보완작업, AS, SS)
  projectType?: string // 프로젝트, AS/SS, 기타
  projectId?: string // 선택된 프로젝트 ID
  customProject?: string // 기타 프로젝트명
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
    level: string | number
  }
  companions?: { // 동행자 목록
    id: string
    name: string
    level: string | number
  }[]
  createdBy: {
    id: string
    name: string
    level: string | number
  }
  createdAt: string
}

// 사용자 타입 정의
interface User {
  id: string
  name: string
  level: string | number
}

// 프로젝트 이벤트 타입 정의
interface ProjectEvent {
  id: string
  type: '조립완료' | '공장시운전' | '현장시운전'
  projectName: string
  projectNumber: string
  date: string
  description?: string
}

// 샘플 이벤트 데이터
const sampleEvents: LocalEvent[] = [
  {
    id: '1',
    category: '기타일정',
    summary: '팀 미팅',
    description: '주간 팀 미팅',
    start: { dateTime: '2024-01-15T10:00:00+09:00' },
    end: { dateTime: '2024-01-15T11:00:00+09:00' },
    location: '회의실 A',
    participant: { id: '2', name: '김철수', level: 3 },
    createdBy: { id: '1', name: '관리자', level: 5 },
    createdAt: '2024-01-15T09:00:00+09:00'
  },
  {
    id: '2',
    category: '조립완료',
    summary: '프로젝트 리뷰',
    description: '프로젝트 진행 상황 리뷰',
    start: { dateTime: '2024-01-16T14:00:00+09:00' },
    end: { dateTime: '2024-01-16T15:30:00+09:00' },
    location: '회의실 B',
    participant: { id: '3', name: '이영희', level: 4 },
    createdBy: { id: '2', name: '김철수', level: 3 },
    createdAt: '2024-01-16T10:00:00+09:00'
  },
  {
    id: '3',
    category: '출장/외근',
    subCategory: '출장',
    summary: '연수 프로그램',
    description: '5일간의 연수 프로그램',
    start: { dateTime: '2024-01-20T09:00:00+09:00' },
    end: { dateTime: '2024-01-24T17:00:00+09:00' },
    location: '교육센터',
    participant: { id: '3', name: '이영희', level: 4 },
    createdBy: { id: '3', name: '이영희', level: 4 },
    createdAt: '2024-01-19T14:00:00+09:00'
  },
  {
    id: '4',
    category: '반/연차',
    subCategory: '연차',
    summary: '휴가',
    description: '개인 휴가',
    start: { date: '2024-01-25' },
    end: { date: '2024-01-27' },
    location: '제주도',
    participant: { id: '4', name: '박민수', level: 2 },
    createdBy: { id: '4', name: '박민수', level: 2 },
    createdAt: '2024-01-24T16:00:00+09:00'
  }
]

export default function SchedulePage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'1month' | '2months' | '3months'>('1month')
  const [events, setEvents] = useState<LocalEvent[]>([])
  const [projectEvents, setProjectEvents] = useState<ProjectEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    project: true,
    vacation: true,
    business: true,
    asss: true
  })

  // 한국 공휴일 데이터
  const koreanHolidays = {
    '2024': {
      '1-1': '신정',
      '2-9': '설날연휴',
      '2-10': '설날',
      '2-11': '설날연휴',
      '2-12': '대체휴무일',
      '3-1': '삼일절',
      '4-10': '국회의원선거',
      '5-5': '어린이날',
      '5-6': '대체휴무일',
      '5-15': '부처님오신날',
      '6-6': '현충일',
      '8-15': '광복절',
      '9-16': '추석연휴',
      '9-17': '추석',
      '9-18': '추석연휴',
      '10-3': '개천절',
      '10-9': '한글날',
      '12-25': '크리스마스'
    },
    '2025': {
      '1-1': '신정',
      '1-28': '설날연휴',
      '1-29': '설날',
      '1-30': '설날연휴',
      '1-31': '대체휴무일',
      '3-1': '삼일절',
      '5-5': '어린이날',
      '5-6': '대체휴무일',
      '5-12': '부처님오신날',
      '6-6': '현충일',
      '8-15': '광복절',
      '10-5': '추석연휴',
      '10-6': '추석',
      '10-7': '추석연휴',
      '10-8': '대체휴무일',
      '10-3': '개천절',
      '10-9': '한글날',
      '12-25': '크리스마스'
    },
    '2026': {
      '1-1': '신정',
      '2-16': '설날연휴',
      '2-17': '설날',
      '2-18': '설날연휴',
      '2-19': '대체휴무일',
      '3-1': '삼일절',
      '5-5': '어린이날',
      '5-6': '대체휴무일',
      '5-24': '부처님오신날',
      '6-6': '현충일',
      '8-15': '광복절',
      '9-24': '추석연휴',
      '9-25': '추석',
      '9-26': '추석연휴',
      '9-27': '대체휴무일',
      '10-3': '개천절',
      '10-9': '한글날',
      '12-25': '크리스마스'
    }
  }

  // 공휴일 확인 함수
  const isHoliday = (date: Date) => {
    const year = date.getFullYear().toString()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const key = `${month}-${day}`
    
    const yearData = koreanHolidays[year as keyof typeof koreanHolidays]
    if (!yearData) return null
    
    return (yearData as any)[key] || null
  }
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LocalEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [newEvent, setNewEvent] = useState({
    category: '',
    subCategory: '',
    subSubCategory: '',
    projectType: '',
    projectId: '',
    customProject: '',
    participantId: '',
    companions: [] as string[], // 동행자 ID 목록
    title: '',
    date: '',
    endDate: '',
    time: '',
    endTime: '',
    description: ''
  })
  
  // 동행자 선택 UI 표시 여부
  const [showCompanionSelection, setShowCompanionSelection] = useState(false)
  
  
  // 통계 관련 state
  const [showStatisticsModal, setShowStatisticsModal] = useState(false)
  
  // 사용자 목록 state
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // 프로젝트 목록 상태
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [showProjectSearch, setShowProjectSearch] = useState(false)
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [loading, isAuthenticated, router])

  // Level3 이상 권한 확인 (새로운 매트릭스 기준)
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const userLevel = user.level || '1'
      if (userLevel === '1' || userLevel === '2') {
        router.push('/dashboard')
      }
    }
  }, [loading, isAuthenticated, user, router])


  // 구글 캘린더에서 일정 가져오기
  useEffect(() => {
    if (isAuthenticated) {
      loadCalendarEvents()
      loadUsers()
      loadProjects()
    }
  }, [isAuthenticated, currentDate, viewMode])

  // 사용자 목록 가져오기
  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const formattedUsers = data.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          level: user.level
        }))
        setUsers(formattedUsers)
      } else {
        console.error('사용자 목록을 가져오는데 실패했습니다.')
        // 실패 시 샘플 데이터 사용
        setUsers([
          { id: '1', name: '관리자', level: 5 },
          { id: '2', name: '김철수', level: 3 },
          { id: '3', name: '이영희', level: 4 },
          { id: '4', name: '박민수', level: 2 }
        ])
      }
    } catch (error) {
      console.error('사용자 목록 로딩 오류:', error)
      // 오류 시 샘플 데이터 사용
      setUsers([
        { id: '1', name: '관리자', level: 5 },
        { id: '2', name: '김철수', level: 3 },
        { id: '3', name: '이영희', level: 4 },
        { id: '4', name: '박민수', level: 2 }
      ])
    } finally {
      setLoadingUsers(false)
    }
  }

  // 프로젝트 목록 가져오기
  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
        setProjects(data)
        setFilteredProjects(data)
        } else {
        console.error('프로젝트 목록을 가져오는데 실패했습니다.')
        setProjects([])
        setFilteredProjects([])
      }
    } catch (error) {
      console.error('프로젝트 목록 로딩 오류:', error)
      setProjects([])
      setFilteredProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  // 프로젝트명 업데이트 함수
  const getUpdatedProjectName = (project: any) => {
    let updatedName = project.projectName || project.project_name
    
    if (project.projectNumber && project.projectNumber.startsWith('CNCWL')) {
      updatedName = `${project.projectName || project.project_name} 선반`
    } else if (project.projectNumber && project.projectNumber.startsWith('CNCUWL')) {
      updatedName = `${project.projectName || project.project_name} 전삭기`
    }
    
    return updatedName
  }

  // 프로젝트 검색
  const handleProjectSearch = (term: string) => {
    setProjectSearchTerm(term)
    if (term.trim() === '') {
      setFilteredProjects(projects)
      } else {
      const filtered = projects.filter(project => 
        project.project_name.toLowerCase().includes(term.toLowerCase()) ||
        project.project_number.toLowerCase().includes(term.toLowerCase()) ||
        getUpdatedProjectName(project).toLowerCase().includes(term.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }

  // 프로젝트 선택
  const handleProjectSelect = (project: any) => {
    setNewEvent({...newEvent, projectId: project.id})
    setShowProjectSearch(false)
    setProjectSearchTerm(getUpdatedProjectName(project))
  }

  // 프로젝트 이벤트 로딩 (일정 API 활용)
  const loadProjectEvents = async () => {
    try {
      // 현재 보기 모드에 따라 날짜 범위 계산
      const today = new Date()
      let startDate: Date
      let endDate: Date
      
      if (viewMode === '1month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      } else if (viewMode === '2months') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      } else { // 3months
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0)
      }
      
      // 일정 API 호출
      const response = await fetch(`/api/schedule?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
      if (response.ok) {
        const data = await response.json()
        const projectEvents: ProjectEvent[] = []
        
        // 일정 API의 프로젝트 이벤트 처리
        if (data.projectEvents) {
          data.projectEvents.forEach((event: any) => {
            projectEvents.push({
              id: `api-${event.id}`,
              type: event.eventType,
              projectName: event.project?.projectName || '',
              projectNumber: event.project?.projectNumber || '',
              date: event.eventDate,
              description: event.description || ''
            })
          })
        }
        
        // 프로젝트 관리 API의 데이터도 처리 (기존 방식 유지)
        const projectsResponse = await fetch('/api/projects')
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json()
          
          projects.forEach((project: any) => {
            // 조립완료일
            if (project.assemblyDate) {
              // YYYY-MM-DD 형식을 직접 파싱하여 로컬 날짜로 처리
              const [year, month, day] = project.assemblyDate.split('-').map(Number)
              const assemblyDate = new Date(year, month - 1, day) // month는 0부터 시작
              if (assemblyDate >= startDate && assemblyDate <= endDate) {
                projectEvents.push({
                  id: `assembly-${project.id}`,
                  type: '조립완료',
                  projectName: getUpdatedProjectName(project),
                  projectNumber: project.projectNumber,
                  date: project.assemblyDate,
                  description: `${project.projectName} 조립완료`
                })
              }
            }
            
            // 공장시운전일
            if (project.factoryTestDate) {
              // YYYY-MM-DD 형식을 직접 파싱하여 로컬 날짜로 처리
              const [year, month, day] = project.factoryTestDate.split('-').map(Number)
              const factoryDate = new Date(year, month - 1, day) // month는 0부터 시작
              if (factoryDate >= startDate && factoryDate <= endDate) {
                projectEvents.push({
                  id: `factory-${project.id}`,
                  type: '공장시운전',
                  projectName: getUpdatedProjectName(project),
                  projectNumber: project.projectNumber,
                  date: project.factoryTestDate,
                  description: `${project.projectName} 공장시운전`
                })
              }
            }
            
            // 현장시운전일
            if (project.siteTestDate) {
              // YYYY-MM-DD 형식을 직접 파싱하여 로컬 날짜로 처리
              const [year, month, day] = project.siteTestDate.split('-').map(Number)
              const siteDate = new Date(year, month - 1, day) // month는 0부터 시작
              if (siteDate >= startDate && siteDate <= endDate) {
                projectEvents.push({
                  id: `site-${project.id}`,
                  type: '현장시운전',
                  projectName: getUpdatedProjectName(project),
                  projectNumber: project.projectNumber,
                  date: project.siteTestDate,
                  description: `${project.projectName} 현장시운전`
                })
              }
            }
          })
        }
        
        // 중복 제거 (같은 프로젝트의 같은 타입)
        const uniqueEvents = projectEvents.filter((event, index, self) => 
          index === self.findIndex(e => e.projectNumber === event.projectNumber && e.type === event.type && e.date === event.date)
        )
        
        setProjectEvents(uniqueEvents)
        console.log('프로젝트 이벤트 불러옴:', uniqueEvents)
        console.log('프로젝트 이벤트 개수:', uniqueEvents.length)
      }
    } catch (err) {
      console.error('프로젝트 이벤트 불러오기 실패:', err)
    }
  }

  const loadCalendarEvents = async () => {
    setLoadingEvents(true)
    setError(null)
    
    try {
      // 로컬 스토리지에서 일정 불러오기
      const savedEvents = localStorage.getItem('localEvents')
      let localEvents: LocalEvent[] = []
      
      if (savedEvents) {
        localEvents = JSON.parse(savedEvents)
        console.log('로컬 일정 불러옴:', localEvents)
      } else {
        // 기본 샘플 데이터
        localEvents = sampleEvents
        console.log('샘플 일정 사용')
      }
      
      // 출장/외근 데이터를 API에서 로드하여 병합
      try {
        const businessTripResponse = await fetch('/api/business-trips')
        if (businessTripResponse.ok) {
          const businessTripData = await businessTripResponse.json()
          const businessTrips = businessTripData.trips || []
          
          // API에서 가져온 출장/외근 데이터를 LocalEvent 형식으로 변환
          const apiBusinessTrips: LocalEvent[] = businessTrips.map((trip: any) => ({
            id: `api_${trip.id}`,
            category: '출장/외근',
            subCategory: trip.trip_type === 'business' ? '출장' : '외근',
            subSubCategory: trip.purpose || '기타',
            summary: trip.title,
            description: trip.purpose,
            start: {
              dateTime: trip.start_date ? `${trip.start_date}T${trip.start_time || '09:00'}:00+09:00` : undefined,
              date: trip.start_date
            },
            end: {
              dateTime: trip.end_date ? `${trip.end_date}T${trip.end_time || '18:00'}:00+09:00` : undefined,
              date: trip.end_date
            },
            location: trip.location || '미지정',
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
          
          // 기존 출장/외근 이벤트 제거하고 API 데이터로 교체
          const nonBusinessEvents = localEvents.filter(event => event.category !== '출장/외근')
          localEvents = [...nonBusinessEvents, ...apiBusinessTrips]
          console.log('API 출장/외근 데이터 병합:', apiBusinessTrips)
        }
      } catch (apiError) {
        console.warn('출장/외근 API 로드 실패, 로컬 데이터 사용:', apiError)
      }
      
      // 연월차 데이터도 API에서 로드 시도 (향후 구현 예정)
      // 현재는 localStorage 데이터만 사용
      
      setEvents(localEvents)
      
      // 프로젝트 이벤트도 함께 로딩
      await loadProjectEvents()
    } catch (err) {
      setError('일정을 불러오는 중 오류가 발생했습니다.')
      console.error('Calendar events loading error:', err)
      setEvents(sampleEvents)
    } finally {
      setLoadingEvents(false)
    }
  }

  // 업무일지에 외근/출장 보고 추가
  const addToWorkDiary = async (event: LocalEvent, participant: User) => {
    try {
      const workContent = `${event.subCategory}${event.subSubCategory ? ` - ${event.subSubCategory}` : ''}: ${event.summary}`
      
      const response = await fetch('/api/work-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: participant.id,
          workDate: event.start.dateTime?.split('T')[0] || event.start.date,
          projectId: 'other', // 외근/출장은 'other'로 설정
          workContent: workContent,
          workType: event.subCategory === '출장' ? '출장' : '외근',
          workSubType: event.subSubCategory || null,
          customProjectName: `${event.subCategory} 업무`
        })
      })

      if (!response.ok) {
        console.error('업무일지 추가 실패:', await response.text())
    } else {
        console.log('업무일지에 외근/출장 보고가 추가되었습니다.')
      }
    } catch (error) {
      console.error('업무일지 추가 중 오류:', error)
    }
  }

  // 새 일정 추가
  const handleAddEvent = async () => {
    if (!newEvent.category || !newEvent.participantId || !newEvent.date) {
      setError('카테고리, 당사자와 시작 날짜를 입력해주세요.')
      return
    }
    
    // 연월차가 아닌 경우 제목 필수 체크
    if (newEvent.category !== '반/연차' && !newEvent.title) {
      setError('제목을 입력해주세요.')
      return
    }

    const startDate = newEvent.date
    const endDate = newEvent.endDate || newEvent.date
    const participant = users.find(u => u.id === newEvent.participantId)
    
    // 동행자 정보 가져오기
    const companions = (newEvent.companions || [])
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as { id: string; name: string; level: string | number }[]

    // 연월차의 경우 자동으로 제목 생성
    const generateTitle = () => {
      if (newEvent.category === '반/연차') {
        const timeText = newEvent.subCategory === '반차' 
          ? (newEvent.start?.time === '09:00' ? '오전' : '오후')
          : ''
        return `${newEvent.subCategory || '연차'}${timeText ? `-${timeText}` : ''}`
      } else if (newEvent.category === '출장' || newEvent.category === '외근' || newEvent.subCategory === '출장' || newEvent.subCategory === '외근') {
        const tripType = newEvent.subCategory || (newEvent.category === '출장' ? '출장' : '외근')
        // 이미 [출장] 또는 [외근]이 포함된 경우 제거하고 새로 추가
        const cleanTitle = newEvent.title.replace(/^\[(출장|외근)\]\s*/, '')
        return `[${tripType}] ${cleanTitle}`
      }
      return newEvent.title
    }

    const event: LocalEvent = {
      id: Date.now().toString(),
      category: newEvent.category,
      subCategory: newEvent.subCategory,
      subSubCategory: newEvent.subSubCategory,
      summary: generateTitle(),
      description: newEvent.description,
      start: { 
        dateTime: `${startDate}T${newEvent.time || '09:00'}:00+09:00` 
      },
      end: { 
        dateTime: `${endDate}T${newEvent.endTime || newEvent.time || '10:00'}:00+09:00` 
      },
      location: '사무실',
      participant: participant || { id: 'unknown', name: 'Unknown User', level: '1' },
      companions: companions.length > 0 ? companions : undefined,
      createdBy: {
        id: user?.id || 'unknown',
        name: user?.name || 'Unknown User',
        level: user?.level || '1'
      },
      createdAt: new Date().toISOString()
    }

    const updatedEvents = [...events, event]
    setEvents(updatedEvents)
    localStorage.setItem('localEvents', JSON.stringify(updatedEvents))
    
    // 외근/출장인 경우 API에도 등록하고 업무일지에 자동 추가
    if ((newEvent.category === '출장/외근' || newEvent.category === '출장' || newEvent.category === '외근' || newEvent.subCategory === '출장' || newEvent.subCategory === '외근') && participant) {
      try {
        // 출장/외근 API에 등록
        const tripResponse = await fetch('/api/business-trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: participant.id,
            userName: participant.name,
            title: event.summary,
            purpose: event.description || event.summary,
            location: event.location || '미지정',
            startDate: startDate,
            endDate: endDate,
            startTime: newEvent.time || null,
            endTime: newEvent.endTime || null
          })
        })

        if (tripResponse.ok) {
          const tripData = await tripResponse.json()
          console.log('출장/외근이 API에 등록되었습니다:', tripData)
          console.log('등록된 데이터 상세:', JSON.stringify(tripData, null, 2))
          
          // Mock 데이터인 경우 localStorage에 추가로 저장
          if (tripData.useLocalStorage && tripData.trip) {
            const existingTrips = JSON.parse(localStorage.getItem('businessTrips') || '[]')
            existingTrips.push(tripData.trip)
            localStorage.setItem('businessTrips', JSON.stringify(existingTrips))
            console.log('출장/외근이 localStorage에 저장되었습니다:', tripData.trip)
          }
        } else {
          const errorText = await tripResponse.text()
          console.warn('출장/외근 API 등록 실패:', errorText)
          console.warn('응답 상태:', tripResponse.status)
        }
      } catch (error) {
        console.error('출장/외근 API 등록 오류:', error)
      }

      await addToWorkDiary(event, participant)
    }
    
    setNewEvent({ category: '', subCategory: '', subSubCategory: '', projectType: '', projectId: '', customProject: '', participantId: '', companions: [], title: '', date: '', endDate: '', time: '', endTime: '', description: '' })
    setShowCompanionSelection(false)
    setShowAddEventModal(false)
    setError(null)
  }

  // 일정 수정
  const handleEditEvent = (event: LocalEvent) => {
    setEditingEvent(event)
    setNewEvent({
      category: event.category,
      subCategory: event.subCategory || '',
      subSubCategory: event.subSubCategory || '',
      projectType: event.projectType || '',
      projectId: event.projectId || '',
      customProject: event.customProject || '',
      participantId: event.participant.id,
      companions: event.companions?.map(c => c.id) || [],
      title: event.summary,
      date: event.start.dateTime?.split('T')[0] || '',
      endDate: event.end.dateTime?.split('T')[0] || '',
      time: event.start.dateTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || '',
      endTime: event.end.dateTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || '',
      description: event.description || ''
    })
    setShowEditEventModal(true)
  }

  // 일정 수정 저장
  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.category || !newEvent.participantId || !newEvent.date) {
      setError('카테고리, 당사자와 시작 날짜를 입력해주세요.')
      return
    }
    
    // 연월차가 아닌 경우 제목 필수 체크
    if (newEvent.category !== '반/연차' && !newEvent.title) {
      setError('제목을 입력해주세요.')
      return
    }

    const startDate = newEvent.date
    const endDate = newEvent.endDate || newEvent.date
    const participant = users.find(u => u.id === newEvent.participantId)
    
    // 동행자 정보 가져오기
    const companions = (newEvent.companions || [])
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as { id: string; name: string; level: string | number }[]

    // 연월차의 경우 자동으로 제목 생성
    const generateTitle = () => {
      if (newEvent.category === '반/연차') {
        const timeText = newEvent.subCategory === '반차' 
          ? (newEvent.start?.time === '09:00' ? '오전' : '오후')
          : ''
        return `${newEvent.subCategory || '연차'}${timeText ? `-${timeText}` : ''}`
      } else if (newEvent.category === '출장' || newEvent.category === '외근' || newEvent.subCategory === '출장' || newEvent.subCategory === '외근') {
        const tripType = newEvent.subCategory || (newEvent.category === '출장' ? '출장' : '외근')
        // 이미 [출장] 또는 [외근]이 포함된 경우 제거하고 새로 추가
        const cleanTitle = newEvent.title.replace(/^\[(출장|외근)\]\s*/, '')
        return `[${tripType}] ${cleanTitle}`
      }
      return newEvent.title
    }

    const updatedEvent: LocalEvent = {
      ...editingEvent,
      category: newEvent.category,
      subCategory: newEvent.subCategory,
      subSubCategory: newEvent.subSubCategory,
      summary: generateTitle(),
      description: newEvent.description,
      participant: participant || editingEvent.participant,
      companions: companions.length > 0 ? companions : undefined,
      start: { 
        dateTime: `${startDate}T${newEvent.time || '09:00'}:00+09:00` 
      },
      end: { 
        dateTime: `${endDate}T${newEvent.endTime || newEvent.time || '10:00'}:00+09:00` 
      }
    }

    const updatedEvents = events.map(e => e.id === editingEvent.id ? updatedEvent : e)
    setEvents(updatedEvents)
    localStorage.setItem('localEvents', JSON.stringify(updatedEvents))
    
    // 외근/출장인 경우 업무일지에 자동 추가
    if ((newEvent.category === '출장/외근' || newEvent.category === '출장' || newEvent.category === '외근' || newEvent.subCategory === '출장' || newEvent.subCategory === '외근') && participant) {
      await addToWorkDiary(updatedEvent, participant)
    }
    
    setNewEvent({ category: '', subCategory: '', subSubCategory: '', projectType: '', projectId: '', customProject: '', participantId: '', companions: [], title: '', date: '', endDate: '', time: '', endTime: '', description: '' })
    setShowCompanionSelection(false)
    setEditingEvent(null)
    setShowEditEventModal(false)
    setError(null)
  }

  // 날짜 더블클릭으로 일정 추가
  const handleDateDoubleClick = (date: Date) => {
    // 로컬 시간대를 사용하여 날짜 문자열 생성
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    setSelectedDate(dateStr)
    setNewEvent({
      category: '',
      subCategory: '',
      subSubCategory: '',
      projectType: '',
      projectId: '',
      customProject: '',
      participantId: '',
      title: '',
      date: dateStr,
      endDate: dateStr,
      time: '',
      endTime: '',
      description: ''
    })
    setShowAddEventModal(true)
  }


  // 통계 계산
  const calculateStatistics = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // 이번 달 일정만 필터링
    const thisMonthEvents = events.filter(event => {
      const eventDate = event.start.dateTime 
        ? new Date(event.start.dateTime)
        : new Date(event.start.date || '')
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })
    
    // 카테고리별 통계
    const categoryStats = thisMonthEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 사용자별 통계
    const userStats = thisMonthEvents.reduce((acc, event) => {
      const userName = event.createdBy.name
      acc[userName] = (acc[userName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 레벨별 통계
    const levelStats = thisMonthEvents.reduce((acc, event) => {
      const level = String(event.createdBy.level)
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalEvents: thisMonthEvents.length,
      categoryStats,
      userStats,
      levelStats,
      thisMonthEvents
    }
  }

  // 일정 삭제
  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId)
    setEvents(updatedEvents)
    localStorage.setItem('localEvents', JSON.stringify(updatedEvents))
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDayEvents = (date: Date) => {
    // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // 로컬 이벤트 필터링
    const localEvents = events.filter(event => {
      // start.dateTime 또는 start.date에서 날짜 추출
      const startDateStr = event.start.dateTime?.split('T')[0] || event.start.date
      const endDateStr = event.end.dateTime?.split('T')[0] || event.end.date || startDateStr
      
      // 유효한 날짜인지 확인
      if (!startDateStr) return false
      
      const startDate = new Date(startDateStr)
      const endDate = endDateStr ? new Date(endDateStr) : startDate
      
      // 유효하지 않은 날짜인 경우 제외
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false
      
      const eventStart = startDate.toISOString().split('T')[0]
      const eventEnd = endDate.toISOString().split('T')[0]
      
      return eventStart && eventEnd && dateStr && eventStart <= dateStr && eventEnd >= dateStr
    }).filter(event => {
      // 필터 적용
      if (event.category === '조립완료' || event.category === '시운전') {
        return filters.project
      } else if (event.category === '반/연차') {
        return filters.vacation
      } else if (event.category === '출장/외근') {
        return filters.business
      } else if (event.category === 'AS/SS') {
        return filters.asss
      }
      return true
    })

    // 프로젝트 이벤트 필터링
    const projectEventsForDay = projectEvents.filter(projectEvent => {
      if (!projectEvent.date) return false
      
      // YYYY-MM-DD 형식을 직접 비교 (시간대 문제 방지)
      const eventDateStr = projectEvent.date
      return eventDateStr === dateStr
    }).filter(() => {
      return filters.project
    })

    // 디버깅을 위한 로그
    if (projectEventsForDay.length > 0) {
      console.log(`날짜 ${dateStr}의 프로젝트 이벤트:`, projectEventsForDay)
    }

    return [...localEvents, ...projectEventsForDay]
  }

  // 기간이 긴 일정인지 확인
  const isMultiDayEvent = (event: LocalEvent) => {
    const startDate = event.start.dateTime 
      ? new Date(event.start.dateTime)
      : new Date(event.start.date || '')
    const endDate = event.end.dateTime 
      ? new Date(event.end.dateTime)
      : new Date(event.end.date || startDate)
    
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 1
  }

  // 일정의 시작/종료 위치 계산
  const getEventPosition = (event: LocalEvent, date: Date) => {
    const startDate = event.start.dateTime 
      ? new Date(event.start.dateTime)
      : new Date(event.start.date || '')
    const endDate = event.end.dateTime 
      ? new Date(event.end.dateTime)
      : new Date(event.end.date || startDate)
    
    const currentDate = new Date(date)
    currentDate.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const dayIndex = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      isStart: dayIndex === 0,
      isEnd: dayIndex === totalDays - 1,
      isMiddle: dayIndex > 0 && dayIndex < totalDays - 1,
      totalDays,
      dayIndex
    }
  }

  const previousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    
    // 이전 달의 마지막 날들
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // 현재 달의 날들
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      days.push({ date: currentDate, isCurrentMonth: true })
    }
    
    // 다음 달의 첫 날들 (7의 배수로 맞추기)
    const remainingDays = 7 - (days.length % 7)
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i)
        days.push({ date: nextDate, isCurrentMonth: false })
      }
    }
    
    return days
  }

  const getDaysForViewMode = (date: Date, mode: '1month' | '2months' | '3months') => {
    const months = []
    const year = date.getFullYear()
    const month = date.getMonth()
    
    if (mode === '1month') {
      months.push({ year, month, isCurrentMonth: true })
    } else if (mode === '2months') {
      months.push({ year, month, isCurrentMonth: true })
      months.push({ year: month === 11 ? year + 1 : year, month: month === 11 ? 0 : month + 1, isCurrentMonth: false })
    } else if (mode === '3months') {
      months.push({ year, month, isCurrentMonth: true })
      months.push({ year: month === 11 ? year + 1 : year, month: month === 11 ? 0 : month + 1, isCurrentMonth: false })
      months.push({ year: month >= 10 ? year + 1 : year, month: month >= 10 ? month - 10 : month + 2, isCurrentMonth: false })
    }
    
    const allDays: Array<{ date: Date; isCurrentMonth: boolean }> = []
    
    months.forEach(({ year: mYear, month: mMonth, isCurrentMonth }) => {
      const monthDays = getDaysInMonth(new Date(mYear, mMonth, 1))
      allDays.push(...monthDays.map(day => ({ ...day, isCurrentMonth: isCurrentMonth && day.isCurrentMonth })))
    })
    
    return allDays
  }

  const getMonthHeaders = (date: Date, mode: '1month' | '2months' | '3months') => {
    const months = []
    const year = date.getFullYear()
    const month = date.getMonth()
    
    if (mode === '1month') {
      months.push({ year, month, isCurrentMonth: true })
    } else if (mode === '2months') {
      months.push({ year, month, isCurrentMonth: true })
      months.push({ year: month === 11 ? year + 1 : year, month: month === 11 ? 0 : month + 1, isCurrentMonth: false })
    } else if (mode === '3months') {
      months.push({ year, month, isCurrentMonth: true })
      months.push({ year: month === 11 ? year + 1 : year, month: month === 11 ? 0 : month + 1, isCurrentMonth: false })
      months.push({ year: month >= 10 ? year + 1 : year, month: month >= 10 ? month - 10 : month + 2, isCurrentMonth: false })
    }
    
    return months.map(({ year: mYear, month: mMonth, isCurrentMonth }) => ({
      year: mYear,
      month: mMonth,
      isCurrentMonth,
      name: `${mYear}년 ${mMonth + 1}월`
    }))
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const days = getDaysForViewMode(currentDate, viewMode)
  const monthHeaders = getMonthHeaders(currentDate, viewMode)

  return (
    <div className="min-h-screen bg-blue-50">
      <CommonHeader
        currentUser={user}
        isAdmin={user?.permissions?.includes('administrator') || false}
        title="일정 관리"
        showBackButton={true}
        backUrl="/"
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={previousMonth}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>이전 달</span>
          </Button>
          
          <h2 className="text-2xl font-semibold text-gray-900">
            {viewMode === '1month' ? formatDate(currentDate) : 
             viewMode === '2months' ? `${formatDate(currentDate)} - ${formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}` :
             `${formatDate(currentDate)} - ${formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1))}`}
          </h2>
          
          <Button
            onClick={nextMonth}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>다음 달</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 캘린더 그리드 */}
        <Card className="mb-8">
          <CardHeader className="bg-white">
            <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Calendar className="h-5 w-5" />
              <span>월간 일정</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              {/* 필터 체크박스들 */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.project}
                    onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">프로젝트</span>
                </label>
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.vacation}
                    onChange={(e) => setFilters(prev => ({ ...prev, vacation: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">반/연차</span>
                </label>
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.business}
                    onChange={(e) => setFilters(prev => ({ ...prev, business: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">출장/외근</span>
                </label>
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.asss}
                    onChange={(e) => setFilters(prev => ({ ...prev, asss: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">AS/SS</span>
                </label>
              </div>
              
              {/* 보기 모드 버튼들 */}
              <div className="flex items-center space-x-1">
                <Button
                  onClick={() => setViewMode('1month')}
                  variant={viewMode === '1month' ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs ${
                    viewMode === '1month' 
                      ? 'bg-blue-800 hover:bg-blue-900 text-white border-2 border-blue-900 shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  1달
                </Button>
                <Button
                  onClick={() => setViewMode('2months')}
                  variant={viewMode === '2months' ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs ${
                    viewMode === '2months' 
                      ? 'bg-blue-800 hover:bg-blue-900 text-white border-2 border-blue-900 shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  2달
                </Button>
                <Button
                  onClick={() => setViewMode('3months')}
                  variant={viewMode === '3months' ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs ${
                    viewMode === '3months' 
                      ? 'bg-blue-800 hover:bg-blue-900 text-white border-2 border-blue-900 shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  3달
                </Button>
              </div>
              
              {user && Number(user.level) >= 5 && (
                <Button
                  onClick={() => setShowStatisticsModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 text-gray-900 bg-gray-100 hover:bg-gray-200 border-gray-300"
                >
                  <Users className="h-4 w-4" />
                  <span>통계</span>
                </Button>
              )}
            </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 달력 컨테이너 */}
            <div className={`grid gap-6 ${viewMode === '1month' ? 'grid-cols-1' : viewMode === '2months' ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {monthHeaders.map((monthHeader, monthIndex) => {
                const monthDays = getDaysInMonth(new Date(monthHeader.year, monthHeader.month, 1))
                return (
                  <div key={`month-${monthIndex}`} className="border-2 border-black rounded-xl p-4 bg-white shadow-lg">
                    {/* 월 제목 */}
                    <div className="text-center text-lg font-bold text-white mb-4 pb-2 border-b-2 border-black bg-black px-2 py-3 rounded-t-lg">
                      {monthHeader.name}
                    </div>
                    
            {/* 요일 헤더 */}
                    <div className="grid grid-cols-7 gap-0 mb-2 bg-black rounded-b-lg">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-white">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 날짜 그리드 */}
                    <div className="grid grid-cols-7 gap-0">
                      {monthDays.map(({ date, isCurrentMonth }, dayIndex) => {
                const dayEvents = getDayEvents(date)
                const isToday = date.toDateString() === new Date().toDateString()
                
                return (
                  <div
                            key={`${monthIndex}-${dayIndex}`}
                            className={`min-h-[120px] p-2 ${
                              isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                            } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''} cursor-pointer hover:bg-gray-100 transition-colors`}
                            style={{
                              borderTop: '1px solid #d1d5db',
                              borderBottom: '1px solid #d1d5db',
                              borderLeft: dayIndex % 7 === 0 ? '1px solid #d1d5db' : 'none',
                              borderRight: '1px solid #d1d5db'
                            }}
                            onDoubleClick={() => handleDateDoubleClick(date)}
                  >
                    <div className={`text-sm font-bold mb-2 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center' : ''} ${
                      isHoliday(date) ? 'text-red-600' : 
                      date.getDay() === 0 ? 'text-red-600' : 
                      date.getDay() === 6 ? 'text-blue-700' : ''
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {/* 공휴일 표시 */}
                    {isHoliday(date) && (
                      <div className="text-xs text-red-600 font-medium mb-1">
                        {isHoliday(date)}
                      </div>
                    )}
                    
                    {/* 일정 표시 */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        // 프로젝트 이벤트인지 확인
                        const isProjectEvent = 'type' in event && 'projectName' in event
                        
                        if (isProjectEvent) {
                          // 프로젝트 이벤트 렌더링
                          const projectEvent = event as ProjectEvent
                          const bgColor = projectEvent.type === '조립완료' ? 'bg-orange-100 border-orange-300' : 
                                         projectEvent.type === '공장시운전' ? 'bg-blue-100 border-blue-300' : 'bg-purple-100 border-purple-300'
                          const textColor = projectEvent.type === '조립완료' ? 'text-orange-800' : 
                                          projectEvent.type === '공장시운전' ? 'text-blue-800' : 'text-purple-800'
                          
                          // 디버깅을 위한 로그
                          console.log('프로젝트 이벤트 렌더링:', {
                            id: projectEvent.id,
                            type: projectEvent.type,
                            projectName: projectEvent.projectName,
                            projectNumber: projectEvent.projectNumber
                          })
                          
                          return (
                            <div
                              key={projectEvent.id}
                              className={`text-xs p-1.5 ${bgColor} ${textColor} rounded-lg truncate font-medium shadow-sm border-2`}
                              title={`${projectEvent.type} ${projectEvent.projectName} (${projectEvent.projectNumber})`}
                            >
                              <div className="text-[10px] leading-tight">
                                <span className="font-medium">{projectEvent.type}</span>
                                <span className="ml-1 opacity-80">{projectEvent.projectName || '프로젝트명 없음'}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        const isMultiDay = isMultiDayEvent(event as LocalEvent)
                        const position = getEventPosition(event as LocalEvent, date)
                        
                        if (isMultiDay) {
                          // 기간이 긴 일정은 막대기 형태로 표시
                          return (
                        <div
                          key={event.id}
                              className={`text-xs p-1 cursor-pointer hover:opacity-80 group relative font-medium ${
                                position.isStart 
                                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-gray-900 border-l-4 border-blue-300' 
                                  : position.isEnd
                                  ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-gray-900 border-r-4 border-blue-300'
                                  : 'bg-blue-50 text-gray-900'
                              }`}
                              style={{
                                marginLeft: position.isStart ? '0' : '-1px',
                                marginRight: position.isEnd ? '0' : '-1px',
                                zIndex: 10,
                                borderRadius: position.isStart && position.isEnd 
                                  ? '4px' 
                                  : position.isStart 
                                    ? '4px 0 0 4px' 
                                    : position.isEnd 
                                      ? '0 4px 4px 0' 
                                      : '0'
                              }}
                              title={`${(event as LocalEvent).summary} (${position.totalDays}일간) - 드래그하여 이동, 더블클릭으로 수정`}
                              onDragStart={(e) => handleDragStart(e, event as LocalEvent)}
                              onDragEnd={handleDragEnd}
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                handleEditEvent(event as LocalEvent)
                              }}
                            >
                              <span className="truncate block">
                                {position.isStart ? (
                                  (event as LocalEvent).category === '반/연차' 
                                    ? `[${(event as LocalEvent).subCategory === '반차' 
                                        ? `반차-${(event as LocalEvent).start?.time === '09:00' ? '오전' : '오후'}`
                                        : (event as LocalEvent).subCategory || '연차'
                                      }] ${(event as LocalEvent).participant?.name || '이름 없음'}`
                                    : (event as LocalEvent).category === '출장/외근' || (event as LocalEvent).category === '출장' || (event as LocalEvent).category === '외근' || (event as LocalEvent).subCategory === '출장' || (event as LocalEvent).subCategory === '외근'
                                    ? `${(event as LocalEvent).summary}${(event as LocalEvent).companions && (event as LocalEvent).companions.length > 0 ? ` +${(event as LocalEvent).companions.length}` : ''}`
                                    : (event as LocalEvent).summary
                                ) : '⋯'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteEvent((event as LocalEvent).id)
                                }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                                title="삭제"
                              >
                                ×
                              </button>
                        </div>
                          )
                        } else {
                          // 하루 일정은 기존 형태로 표시
                          return (
                        <div
                          key={event.id}
                              className={`text-xs p-2 bg-blue-50 text-gray-900 rounded-lg truncate cursor-pointer hover:bg-blue-100 group relative font-medium shadow-sm border`}
                              title={`${(event as LocalEvent).summary} - 더블클릭으로 수정`}
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                handleEditEvent(event as LocalEvent)
                              }}
                            >
                              <span className="truncate block font-semibold">
                                {(event as LocalEvent).category === '반/연차' 
                                  ? `[${(event as LocalEvent).subCategory === '반차' 
                                      ? `반차-${(event as LocalEvent).start?.time === '09:00' ? '오전' : '오후'}`
                                      : (event as LocalEvent).subCategory || '연차'
                                    }] ${(event as LocalEvent).participant?.name || '이름 없음'}`
                                  : (event as LocalEvent).category === '출장/외근' || (event as LocalEvent).category === '출장' || (event as LocalEvent).category === '외근' || (event as LocalEvent).subCategory === '출장' || (event as LocalEvent).subCategory === '외근'
                                  ? (() => {
                                      const tripType = (event as LocalEvent).subCategory || ((event as LocalEvent).category === '출장' ? '출장' : '외근')
                                      const summary = (event as LocalEvent).summary
                                      const companions = (event as LocalEvent).companions && (event as LocalEvent).companions.length > 0 ? ` +${(event as LocalEvent).companions.length}` : ''
                                      
                                      // 이미 [출장] 또는 [외근]이 포함된 경우 그대로 사용
                                      if (summary.startsWith('[출장]') || summary.startsWith('[외근]')) {
                                        return `${summary}${companions}`
                                      }
                                      
                                      return `[${tripType}] ${summary}${companions}`
                                    })()
                                  : (event as LocalEvent).summary
                                }
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteEvent((event as LocalEvent).id)
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600 flex items-center justify-center"
                                title="삭제"
                              >
                                ×
                              </button>
                        </div>
                          )
                        }
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-900 text-center">
                          +{dayEvents.length - 3} 더보기
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>


        {/* 일정 추가 모달 */}
        {showAddEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">새 일정 추가</h3>
              
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* 카테고리 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({...newEvent, category: e.target.value, subCategory: '', subSubCategory: '', projectType: '', projectId: '', customProject: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">카테고리를 선택하세요</option>
                      <option value="출장">출장</option>
                      <option value="외근">외근</option>
                      <option value="반/연차">반/연차</option>
                    </select>
              </div>
                  
                  {/* 출장/외근 선택 시 프로젝트 타입 선택 */}
                  {(newEvent.category === '출장' || newEvent.category === '외근') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        프로젝트 타입 *
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, projectType: '프로젝트', projectId: '', customProject: ''})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.projectType === '프로젝트' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          프로젝트
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, projectType: 'AS/SS', projectId: '', customProject: ''})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.projectType === 'AS/SS' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          AS/SS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, projectType: '기타', projectId: '', customProject: ''})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.projectType === '기타' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          기타
                        </button>
              </div>
              </div>
                  )}
                  
                  {/* 동행자 선택 (토글) */}
                  {showCompanionSelection && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        동행자 선택 (선택사항)
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {users.map(user => (
                          <label key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newEvent.companions?.includes(user.id) || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewEvent(prev => ({
                                    ...prev,
                                    companions: [...(prev.companions || []), user.id]
                                  }))
                                } else {
                                  setNewEvent(prev => ({
                                    ...prev,
                                    companions: (prev.companions || []).filter(id => id !== user.id)
                                  }))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{user.name} ({user.level})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 반/연차 선택 시 구분 선택 */}
                  {newEvent.category === '반/연차' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        구분 *
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subCategory: '반차', start: {...newEvent.start, time: '09:00'}})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subCategory === '반차' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          반차
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subCategory: '연차', start: {...newEvent.start, time: ''}})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subCategory === '연차' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          연차
                        </button>
                      </div>
                      
                      {/* 반차 선택 시 오전/오후 선택 */}
                      {newEvent.subCategory === '반차' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            시간대 *
                          </label>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => setNewEvent({...newEvent, start: {...newEvent.start, time: '09:00'}})}
                              className={`px-4 py-2 rounded-md border text-sm font-medium ${
                                newEvent.start?.time === '09:00' 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              오전
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewEvent({...newEvent, start: {...newEvent.start, time: '14:00'}})}
                              className={`px-4 py-2 rounded-md border text-sm font-medium ${
                                newEvent.start?.time === '14:00' 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              오후
                            </button>
                          </div>
                        </div>
                      )}
                            </div>
                          )}
                          
                  {/* 프로젝트 타입이 프로젝트일 때 프로젝트 선택 */}
                  {newEvent.projectType === '프로젝트' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        프로젝트 선택 *
                      </label>
                      <div className="relative">
                        <div className="flex">
                          <Input
                            value={projectSearchTerm}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                setNewEvent({...newEvent, projectId: '', subSubCategory: ''})
                                setProjectSearchTerm('')
                              }
                              handleProjectSearch(e.target.value)
                            }}
                            onFocus={() => setShowProjectSearch(true)}
                            placeholder="프로젝트를 검색하세요"
                            className="rounded-r-none bg-white text-gray-900"
                          />
                          <Button
                            type="button"
                            onClick={() => setShowProjectSearch(!showProjectSearch)}
                            className="px-3 py-2 border border-l-0 border-gray-300 rounded-l-none bg-gray-50 hover:bg-gray-100"
                          >
                            🔍
                          </Button>
                            </div>
                        
                        {/* 프로젝트 검색 결과 드롭다운 */}
                        {showProjectSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProjects.length > 0 ? (
                              filteredProjects.map(project => (
                                <div
                                  key={project.id}
                                  onClick={() => handleProjectSelect(project)}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{getUpdatedProjectName(project)}</div>
                                  <div className="text-sm text-gray-600">{project.project_number}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500">검색 결과가 없습니다</div>
                          )}
                        </div>
                        )}
                      </div>
                          </div>
                        )}
                        
                  {/* AS/SS 선택 시 프로젝트 선택 */}
                  {newEvent.projectType === 'AS/SS' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        프로젝트 선택 *
                      </label>
                      <div className="relative">
                        <div className="flex">
                          <Input
                            value={projectSearchTerm}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                setNewEvent({...newEvent, projectId: '', subSubCategory: ''})
                                setProjectSearchTerm('')
                              }
                              handleProjectSearch(e.target.value)
                            }}
                            onFocus={() => setShowProjectSearch(true)}
                            placeholder="프로젝트를 검색하세요"
                            className="rounded-r-none bg-white text-gray-900"
                          />
                          <Button
                            type="button"
                            onClick={() => setShowProjectSearch(!showProjectSearch)}
                            className="px-3 py-2 border border-l-0 border-gray-300 rounded-l-none bg-gray-50 hover:bg-gray-100"
                          >
                            🔍
                          </Button>
                        </div>
                        
                        {/* 프로젝트 검색 결과 드롭다운 */}
                        {showProjectSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProjects.length > 0 ? (
                              filteredProjects.map(project => (
                                <div
                                  key={project.id}
                                  onClick={() => handleProjectSelect(project)}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{getUpdatedProjectName(project)}</div>
                                  <div className="text-sm text-gray-600">{project.project_number}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500">검색 결과가 없습니다</div>
                        )}
                      </div>
                        )}
                    </div>
                  </div>
                  )}

                  {/* AS/SS 선택 시 세부구분 */}
                  {newEvent.projectType === 'AS/SS' && newEvent.projectId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        세부구분 *
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subSubCategory: 'AS'})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subSubCategory === 'AS' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          AS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subSubCategory: 'SS'})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subSubCategory === 'SS' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          SS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subSubCategory: 'OV'})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subSubCategory === 'OV' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          OV
                        </button>
                      </div>
              </div>
            )}

                  {/* 프로젝트 선택 후 세부구분 */}
                  {newEvent.projectType === '프로젝트' && newEvent.projectId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        세부구분 *
                      </label>
                      <select
                        value={newEvent.subSubCategory || ''}
                        onChange={(e) => setNewEvent({...newEvent, subSubCategory: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">세부구분을 선택하세요</option>
                        <option value="현장답사">현장답사</option>
                        <option value="사양협의">사양협의</option>
                        <option value="시운전">시운전</option>
                        <option value="보완작업">보완작업</option>
                      </select>
                  </div>
                  )}
                  
                  {/* 프로젝트 타입이 기타일 때 텍스트 입력 */}
                  {newEvent.projectType === '기타' && (
                  <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        기타 내용 *
                      </label>
                      <Input
                        value={newEvent.customProject || ''}
                        onChange={(e) => setNewEvent({...newEvent, customProject: e.target.value})}
                        placeholder="기타 내용을 입력하세요"
                        className="bg-white text-gray-900"
                      />
                          </div>
                        )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    당사자 *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={newEvent.participantId}
                      onChange={(e) => setNewEvent({...newEvent, participantId: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">당사자를 선택하세요</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {(newEvent.category === '출장' || newEvent.category === '외근' || newEvent.subCategory === '출장' || newEvent.subCategory === '외근') && (
                      <button
                        type="button"
                        onClick={() => setShowCompanionSelection(!showCompanionSelection)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>동행자</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 연월차가 아닌 경우에만 제목 입력 표시 */}
                {newEvent.category !== '반/연차' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      제목 *
                    </label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="일정 제목을 입력하세요"
                      className="bg-white text-gray-900"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      시작 날짜 *
                    </label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      종료 날짜
                    </label>
                    <Input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                      className="bg-white text-gray-900"
                    />
              </div>
                </div>
                
                {/* 연월차가 아닌 경우에만 시간 입력 표시 */}
                {newEvent.category !== '반/연차' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        시작 시간
                      </label>
                      <Input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        종료 시간
                      </label>
                      <Input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                        className="bg-white text-gray-900"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    설명
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="일정 설명을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                      <Button 
                        variant="outline" 
                  onClick={() => setShowAddEventModal(false)}
                  className="text-white bg-gray-800 hover:bg-gray-700"
                      >
                  취소
                      </Button>
                      <Button 
                  onClick={handleAddEvent}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                  추가
                      </Button>
                    </div>
                  </div>
                </div>
        )}

        {/* 일정 수정 모달 */}
        {showEditEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">일정 수정</h3>
              
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* 카테고리 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({...newEvent, category: e.target.value, subCategory: '', subSubCategory: '', projectType: '', projectId: '', customProject: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">카테고리를 선택하세요</option>
                      <option value="출장">출장</option>
                      <option value="외근">외근</option>
                      <option value="반/연차">반/연차</option>
                    </select>
              </div>
                  
                  {/* 출장/외근 선택 시 프로젝트 타입 선택 */}
                  {(newEvent.category === '출장' || newEvent.category === '외근') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        프로젝트 타입 *
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, projectType: '프로젝트', projectId: '', customProject: ''})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.projectType === '프로젝트' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          프로젝트
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, projectType: 'AS/SS', projectId: '', customProject: ''})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.projectType === 'AS/SS' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          AS/SS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, projectType: '기타', projectId: '', customProject: ''})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.projectType === '기타' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          기타
                        </button>
                  </div>
                    </div>
                  )}
                  
                  {/* 동행자 선택 (토글) */}
                  {showCompanionSelection && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        동행자 선택 (선택사항)
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {users.map(user => (
                          <label key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newEvent.companions?.includes(user.id) || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewEvent(prev => ({
                                    ...prev,
                                    companions: [...(prev.companions || []), user.id]
                                  }))
                                } else {
                                  setNewEvent(prev => ({
                                    ...prev,
                                    companions: (prev.companions || []).filter(id => id !== user.id)
                                  }))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{user.name} ({user.level})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 반/연차 선택 시 구분 선택 */}
                  {newEvent.category === '반/연차' && (
                  <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        구분 *
                      </label>
                    <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subCategory: '반차', start: {...newEvent.start, time: '09:00'}})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subCategory === '반차' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          반차
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subCategory: '연차', start: {...newEvent.start, time: ''}})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subCategory === '연차' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          연차
                        </button>
                      </div>
                      
                      {/* 반차 선택 시 오전/오후 선택 */}
                      {newEvent.subCategory === '반차' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            시간대 *
                          </label>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => setNewEvent({...newEvent, start: {...newEvent.start, time: '09:00'}})}
                              className={`px-4 py-2 rounded-md border text-sm font-medium ${
                                newEvent.start?.time === '09:00' 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              오전
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewEvent({...newEvent, start: {...newEvent.start, time: '14:00'}})}
                              className={`px-4 py-2 rounded-md border text-sm font-medium ${
                                newEvent.start?.time === '14:00' 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              오후
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 프로젝트 타입이 프로젝트일 때 프로젝트 선택 */}
                  {newEvent.projectType === '프로젝트' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        프로젝트 선택 *
                      </label>
                      <div className="relative">
                        <div className="flex">
                          <Input
                            value={projectSearchTerm}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                setNewEvent({...newEvent, projectId: '', subSubCategory: ''})
                                setProjectSearchTerm('')
                              }
                              handleProjectSearch(e.target.value)
                            }}
                            onFocus={() => setShowProjectSearch(true)}
                            placeholder="프로젝트를 검색하세요"
                            className="rounded-r-none bg-white text-gray-900"
                          />
                      <Button 
                            type="button"
                            onClick={() => setShowProjectSearch(!showProjectSearch)}
                            className="px-3 py-2 border border-l-0 border-gray-300 rounded-l-none bg-gray-50 hover:bg-gray-100"
                          >
                            🔍
                      </Button>
                        </div>
                        
                        {/* 프로젝트 검색 결과 드롭다운 */}
                        {showProjectSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProjects.length > 0 ? (
                              filteredProjects.map(project => (
                                <div
                                  key={project.id}
                                  onClick={() => handleProjectSelect(project)}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{getUpdatedProjectName(project)}</div>
                                  <div className="text-sm text-gray-600">{project.project_number}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500">검색 결과가 없습니다</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AS/SS 선택 시 프로젝트 선택 */}
                  {newEvent.projectType === 'AS/SS' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        프로젝트 선택 *
                      </label>
                      <div className="relative">
                        <div className="flex">
                          <Input
                            value={projectSearchTerm}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                setNewEvent({...newEvent, projectId: '', subSubCategory: ''})
                                setProjectSearchTerm('')
                              }
                              handleProjectSearch(e.target.value)
                            }}
                            onFocus={() => setShowProjectSearch(true)}
                            placeholder="프로젝트를 검색하세요"
                            className="rounded-r-none bg-white text-gray-900"
                          />
                      <Button 
                            type="button"
                            onClick={() => setShowProjectSearch(!showProjectSearch)}
                            className="px-3 py-2 border border-l-0 border-gray-300 rounded-l-none bg-gray-50 hover:bg-gray-100"
                          >
                            🔍
                          </Button>
                        </div>
                        
                        {/* 프로젝트 검색 결과 드롭다운 */}
                        {showProjectSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProjects.length > 0 ? (
                              filteredProjects.map(project => (
                                <div
                                  key={project.id}
                                  onClick={() => handleProjectSelect(project)}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{getUpdatedProjectName(project)}</div>
                                  <div className="text-sm text-gray-600">{project.project_number}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500">검색 결과가 없습니다</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AS/SS 선택 시 세부구분 */}
                  {newEvent.projectType === 'AS/SS' && newEvent.projectId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        세부구분 *
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subSubCategory: 'AS'})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subSubCategory === 'AS' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          AS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subSubCategory: 'SS'})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subSubCategory === 'SS' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          SS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({...newEvent, subSubCategory: 'OV'})}
                          className={`px-4 py-2 rounded-md border text-sm font-medium ${
                            newEvent.subSubCategory === 'OV' 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          OV
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 프로젝트 선택 후 세부구분 */}
                  {newEvent.projectType === '프로젝트' && newEvent.projectId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        세부구분 *
                      </label>
                      <select
                        value={newEvent.subSubCategory || ''}
                        onChange={(e) => setNewEvent({...newEvent, subSubCategory: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">세부구분을 선택하세요</option>
                        <option value="현장답사">현장답사</option>
                        <option value="사양협의">사양협의</option>
                        <option value="시운전">시운전</option>
                        <option value="보완작업">보완작업</option>
                      </select>
                    </div>
                  )}
                  
                  {/* 프로젝트 타입이 기타일 때 텍스트 입력 */}
                  {newEvent.projectType === '기타' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        기타 내용 *
                      </label>
                      <Input
                        value={newEvent.customProject || ''}
                        onChange={(e) => setNewEvent({...newEvent, customProject: e.target.value})}
                        placeholder="기타 내용을 입력하세요"
                        className="bg-white text-gray-900"
                      />
                    </div>
                  )}
                </div>
                
                  <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    당사자 *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={newEvent.participantId}
                      onChange={(e) => setNewEvent({...newEvent, participantId: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">당사자를 선택하세요</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {(newEvent.category === '출장' || newEvent.category === '외근' || newEvent.subCategory === '출장' || newEvent.subCategory === '외근') && (
                      <button
                        type="button"
                        onClick={() => setShowCompanionSelection(!showCompanionSelection)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>동행자</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 연월차가 아닌 경우에만 제목 입력 표시 */}
                {newEvent.category !== '반/연차' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      제목 *
                    </label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="일정 제목을 입력하세요"
                      className="bg-white text-gray-900"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      시작 날짜 *
                    </label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      종료 날짜
                    </label>
                    <Input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                      className="bg-white text-gray-900"
                    />
                  </div>
                </div>
                
                {/* 연월차가 아닌 경우에만 시간 입력 표시 */}
                {newEvent.category !== '반/연차' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        시작 시간
                      </label>
                      <Input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        종료 시간
                      </label>
                      <Input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                        className="bg-white text-gray-900"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    설명
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="일정 설명을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                      <Button 
                        variant="outline"
                  onClick={() => setShowEditEventModal(false)}
                  className="text-white bg-gray-800 hover:bg-gray-700"
                      >
                  취소
                      </Button>
                      <Button 
                  onClick={handleUpdateEvent}
                  className="bg-green-600 hover:bg-green-700 text-white"
                      >
                  수정
                      </Button>
                    </div>
                  </div>
                </div>
                          )}
                          
        {/* 통계 모달 */}
        {showStatisticsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">일정 통계</h3>
              
              {(() => {
                const stats = calculateStatistics()
                return (
                  <div className="space-y-6">
                    {/* 전체 통계 */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">이번 달 전체 일정</h4>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalEvents}건</p>
              </div>
                    
                    {/* 카테고리별 통계 */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">카테고리별 통계</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.categoryStats).map(([category, count]) => (
                          <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium text-gray-900">{category}</span>
                            <Badge variant="secondary">{count}건</Badge>
                  </div>
                        ))}
                        </div>
                      </div>
                      
                    {/* 사용자별 통계 */}
                  <div>
                      <h4 className="font-medium text-gray-900 mb-3">사용자별 통계</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.userStats).map(([userName, count]) => (
                          <div key={userName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium text-gray-900">{userName}</span>
                            <Badge variant="outline">{count}건</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 레벨별 통계 */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">레벨별 통계</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.levelStats).map(([level, count]) => (
                          <div key={level} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium text-gray-900">Level {level}</span>
                            <Badge variant="outline">{count}건</Badge>
                  </div>
                ))}
              </div>
                    </div>
                    
                    {/* 최근 일정 목록 */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">최근 등록된 일정</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {stats.thisMonthEvents
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map(event => (
                            <div key={event.id} className="p-2 bg-gray-50 rounded text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium text-gray-900">{event.summary}</span>
                                  <span className="text-gray-900 ml-2">
                                    ({event.category}
                                    {event.subCategory && ` - ${event.subCategory}`}
                                    {event.subSubCategory && ` - ${event.subSubCategory}`})
                                  </span>
                                </div>
                                <div className="text-xs text-gray-900">
                                  {event.createdBy.name}
                                </div>
                </div>
              </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
              
              <div className="flex justify-end mt-6">
                      <Button 
                  onClick={() => setShowStatisticsModal(false)}
                        variant="outline"
                        className="text-white bg-gray-800 hover:bg-gray-700"
                      >
                  닫기
                      </Button>
                  </div>
                </div>
              </div>
            )}

      </div>
    </div>
  )
}
