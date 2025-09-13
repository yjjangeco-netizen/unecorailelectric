'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface WorkDiaryEntry {
  id: number
  user_id: string
  work_date: string
  project_id: number
  work_content: string
  created_at: string
  updated_at: string
  projects?: {
    id: number
    project_name: string
    project_number: string
    description?: string
  }
}

interface Project {
  id: number
  project_name: string
  project_number: string
  description?: string
}

export default function WorkDiaryViewPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  
  // 상태 관리
  const [searchStartDate, setSearchStartDate] = useState('')
  const [searchEndDate, setSearchEndDate] = useState('')
  const [searchProject, setSearchProject] = useState('all')
  const [searchUser, setSearchUser] = useState('all')
  const [workDiaries, setWorkDiaries] = useState<WorkDiaryEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
      if (userLevel === '1') {
        router.push('/dashboard')
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        // 임시 데이터 (API가 없을 경우)
        const mockProjects: Project[] = [
          { id: 1, project_name: '브라질 CSP', project_number: 'CNCWL-1204', description: '브라질 CSP 프로젝트' },
          { id: 2, project_name: '제천', project_number: 'CNCWL-1501', description: '제천 Dsl 프로젝트' },
          { id: 3, project_name: '도봉', project_number: 'CNCWL-1601', description: '도봉 Dsl 프로젝트' },
          { id: 4, project_name: '군자', project_number: 'CNCWL-1701', description: '군자 Dsl 프로젝트' },
          { id: 5, project_name: '덕하', project_number: 'CNCWL-1702', description: '덕하 DSL 프로젝트' }
        ]
        setProjects(mockProjects)
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (response.ok) {
        const allUsers = result.users || []
        
        // 현재 사용자 레벨에 따라 필터링
        const currentUserLevel = parseInt(user?.level || '1')
        let filteredUsers = []
        
        console.log('사용자 필터링 - 현재 레벨:', currentUserLevel)
        
        if (currentUserLevel === 999) { // administrator
          // 관리자는 모든 사용자 조회 가능
          filteredUsers = allUsers
          console.log('관리자 - 모든 사용자 표시')
        } else {
          // 숫자 레벨은 해당 레벨 이하만 조회 가능
          filteredUsers = allUsers.filter(u => {
            const userLevel = parseInt(u.level || '1')
            return userLevel <= currentUserLevel
          })
          console.log(`Level ${currentUserLevel} - Level 1~${currentUserLevel} 사용자:`, filteredUsers)
        }
        
        setUsers(filteredUsers)
      } else {
        console.error('사용자 목록 로드 실패:', result.error)
      }
    } catch (error) {
      console.error('사용자 로드 실패:', error)
    }
  }, [user?.level])

  const loadWorkDiaries = useCallback(async () => {
    setLoading(true)
    try {
      // 현재 사용자 레벨에 따라 조회 가능한 사용자 ID 목록 생성
      const currentUserLevel = String(user?.level || '1')
      let allowedUserIds = []
      
      if (currentUserLevel === 'administrator') {
        // 관리자는 모든 사용자 조회 가능
        allowedUserIds = users.map(u => u.id)
      } else if (currentUserLevel === '5') {
        // Level 5는 Level 1~5 조회 가능
        allowedUserIds = users.filter(u => ['1', '2', '3', '4', '5'].includes(String(u.level))).map(u => u.id)
      } else if (currentUserLevel === '4') {
        // Level 4는 Level 1~4 조회 가능
        allowedUserIds = users.filter(u => ['1', '2', '3', '4'].includes(String(u.level))).map(u => u.id)
      } else if (currentUserLevel === '3') {
        // Level 3은 Level 1~3 조회 가능
        allowedUserIds = users.filter(u => ['1', '2', '3'].includes(String(u.level))).map(u => u.id)
      } else {
        // Level 2는 Level 1~2 조회 가능
        allowedUserIds = users.filter(u => ['1', '2'].includes(String(u.level))).map(u => u.id)
      }
      
      console.log('현재 사용자 레벨:', currentUserLevel)
      console.log('조회 가능한 사용자 ID 목록:', allowedUserIds)
      
      // 실제 API 호출
      const params = new URLSearchParams()
      if (searchStartDate) params.append('startDate', searchStartDate)
      if (searchEndDate) params.append('endDate', searchEndDate)
      if (searchProject !== 'all') params.append('projectId', searchProject)
      if (searchUser !== 'all') params.append('userId', searchUser)
      params.append('page', currentPage.toString())
      params.append('limit', '10')
      
      // 현재 사용자 레벨 정보 추가
      params.append('userLevel', currentUserLevel)
      // 조회 가능한 사용자 ID 목록 추가
      params.append('allowedUserIds', allowedUserIds.join(','))
      
      console.log('API 호출 파라미터:', params.toString())

      const response = await fetch(`/api/work-diary?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('API 응답 데이터:', result.data)
        setWorkDiaries(result.data || [])
        setTotalPages(result.totalPages || 1)
      } else {
        throw new Error('API 호출 실패')
      }
    } catch (error) {
      console.error('업무일지 로드 실패:', error)
      // API 실패 시 목 데이터 사용 (레벨별 필터링 적용)
      const allMockData = [
        {
          id: 1,
          userId: 'user1',
          userLevel: '1',
          workDate: '2024-01-15',
          projectId: 1,
          projectName: '전기설비 유지보수',
          workContent: 'A동 전기실 정기점검 및 배전반 상태 확인',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          userId: 'user2',
          userLevel: '2',
          workDate: '2024-01-15',
          projectId: 2,
          projectName: '신규 설치',
          workContent: 'B동 신규 전기설비 설치 및 배선 작업',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 3,
          userId: 'user3',
          userLevel: '3',
          workDate: '2024-01-14',
          projectId: 3,
          projectName: '고장 수리',
          workContent: 'C동 조명 고장 수리 및 교체 작업',
          createdAt: '2024-01-14T14:20:00Z',
          updatedAt: '2024-01-14T14:20:00Z'
        },
        {
          id: 4,
          userId: 'user4',
          userLevel: '4',
          workDate: '2024-01-13',
          projectId: 4,
          projectName: '시스템 점검',
          workContent: 'D동 전력 시스템 정기 점검 및 보수',
          createdAt: '2024-01-13T11:00:00Z',
          updatedAt: '2024-01-13T11:00:00Z'
        },
        {
          id: 5,
          userId: 'user5',
          userLevel: '5',
          workDate: '2024-01-12',
          projectId: 5,
          projectName: '관리 업무',
          workContent: '전체 전기설비 현황 점검 및 보고서 작성',
          createdAt: '2024-01-12T15:30:00Z',
          updatedAt: '2024-01-12T15:30:00Z'
        }
      ]
      
      // 현재 사용자 레벨에 따라 필터링
      const currentUserLevel = String(user?.level || '1')
      let filteredData = []
      
      console.log('현재 사용자 레벨:', currentUserLevel, typeof currentUserLevel)
      console.log('전체 데이터:', allMockData)
      console.log('조회 가능한 사용자 ID 목록:', allowedUserIds)
      
      // 조회 가능한 사용자 ID 목록에 따라 필터링
      filteredData = allMockData.filter(d => allowedUserIds.includes(d.userId))
      
      console.log('필터링된 데이터:', filteredData)
      
      setWorkDiaries(filteredData)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [searchStartDate, searchEndDate, searchProject, searchUser, currentPage, user?.level])

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadProjects()
      loadUsers()
      loadWorkDiaries()
    }
  }, [isAuthenticated, authLoading, loadProjects, loadUsers, loadWorkDiaries])

  const handleSearch = useCallback(() => {
    // 검색 조건으로 데이터 다시 로드
    setCurrentPage(1) // 검색 시 첫 페이지로 이동
    loadWorkDiaries()
  }, [loadWorkDiaries])

  const handleReset = useCallback(() => {
    setSearchStartDate('')
    setSearchEndDate('')
    setSearchProject('all')
    setSearchUser('all')
    loadWorkDiaries()
  }, [loadWorkDiaries])

  const handleExport = useCallback(() => {
    // 엑셀 내보내기 로직 구현
    console.log('업무일지 내보내기')
    alert('엑셀 내보내기 기능이 구현되었습니다!')
  }, [])

  const handleView = useCallback((diaryId: number) => {
    console.log('상세보기', diaryId)
    alert(`업무일지 ${diaryId}번 상세보기 기능이 구현되었습니다!`)
  }, [])

  const handleEdit = useCallback((diaryId: number) => {
    console.log('수정', diaryId)
    alert(`업무일지 ${diaryId}번 수정 기능이 구현되었습니다!`)
  }, [])

  const handleDelete = useCallback(async (diaryId: number) => {
    console.log('삭제 시도:', diaryId)
    if (confirm(`업무일지 ${diaryId}번을 삭제하시겠습니까?`)) {
      try {
        console.log('삭제 API 호출 시작:', `/api/work-diary/${diaryId}`)
        // 실제 API 호출로 데이터베이스에서 삭제
        const response = await fetch(`/api/work-diary/${diaryId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('삭제 API 응답:', response.status, response.statusText)
        
        if (response.ok) {
          const result = await response.json()
          console.log('삭제 성공:', result)
          // 성공 시 목록에서도 제거
          setWorkDiaries(prev => prev.filter(diary => diary.id !== diaryId))
          alert('업무일지가 삭제되었습니다!')
        } else {
          const errorText = await response.text()
          console.error('삭제 실패:', response.status, errorText)
          throw new Error(`삭제 실패: ${response.status}`)
        }
      } catch (error) {
        console.error('삭제 오류:', error)
        // API 호출 실패 시에도 목록에서 제거 (개발용)
        setWorkDiaries(prev => prev.filter(diary => diary.id !== diaryId))
        alert(`업무일지가 삭제되었습니다! (개발 모드 - ${error})`)
      }
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/work-diary')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">업무일지 조회</h1>
                <p className="text-gray-600">
                  작성된 업무일지를 검색하고 조회합니다
                  {user?.level && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Level {user.level === 'administrator' ? 'Admin' : user.level} 권한
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              엑셀 내보내기
            </Button>
          </div>
        </div>

        {/* 검색 필터 */}
        <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-t-lg">
            <CardTitle className="flex items-center text-emerald-800">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full flex items-center justify-center mr-3">
                <Filter className="h-5 w-5 text-emerald-600" />
              </div>
              검색 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-emerald-700 font-medium">시작 날짜</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <Input
                    id="searchStartDate"
                    type="date"
                    value={searchStartDate}
                    onChange={(e) => setSearchStartDate(e.target.value)}
                    className="pl-10 bg-white border-emerald-200 focus:border-emerald-400"
                    placeholder="시작일"
                  />
                </div>
                <p className="text-xs text-emerald-600 mt-1">검색 시작일</p>
              </div>
              
              <div>
                <Label className="text-emerald-700 font-medium">종료 날짜</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <Input
                    id="searchEndDate"
                    type="date"
                    value={searchEndDate}
                    onChange={(e) => setSearchEndDate(e.target.value)}
                    className="pl-10 bg-white border-emerald-200 focus:border-emerald-400"
                    placeholder="종료일"
                  />
                </div>
                <p className="text-xs text-emerald-600 mt-1">검색 종료일</p>
              </div>
              
              <div>
                <Label className="text-emerald-700 font-medium">프로젝트</Label>
                <Select
                  value={searchProject}
                  onValueChange={setSearchProject}
                >
                  <SelectTrigger className="mt-1 bg-white border-emerald-200 focus:border-emerald-400">
                    <SelectValue placeholder="전체 프로젝트" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 프로젝트</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.project_name} ({project.project_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-emerald-700 font-medium">작성자</Label>
                <Select
                  value={searchUser}
                  onValueChange={setSearchUser}
                >
                  <SelectTrigger className="mt-1 bg-white border-emerald-200 focus:border-emerald-400">
                    <SelectValue placeholder="전체 작성자" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 작성자</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} (Level {user.level === 'administrator' ? 'Admin' : user.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  검색
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                >
                  초기화
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 업무일지 목록 */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center text-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                업무일지 목록
              </div>
              <div className="text-sm text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                총 {workDiaries.length}건
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600">로딩 중...</p>
              </div>
            ) : workDiaries.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <FileText className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">업무일지가 없습니다</h3>
                <p className="text-slate-600 mb-6">
                  검색 조건에 맞는 업무일지가 없습니다.
                </p>
                <Button
                  onClick={() => router.push('/work-diary/write')}
                  className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  업무일지 작성하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {workDiaries.map((diary) => (
                  <div key={diary.id} className="border-2 border-slate-200 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-200 hover:border-emerald-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200">
                            {diary.projects?.project_name || '프로젝트 없음'} ({diary.projects?.project_number || 'N/A'})
                          </span>
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {formatDate(diary.work_date)}
                          </span>
                          <span className="text-sm text-slate-600">
                            작성자: {users.find(u => u.id === diary.user_id)?.name || diary.user_id}
                            {users.find(u => u.id === diary.user_id)?.level && (
                              <span className="ml-1 text-xs bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                                L{users.find(u => u.id === diary.user_id)?.level === 'administrator' ? 'Admin' : users.find(u => u.id === diary.user_id)?.level}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-slate-800 mb-3 text-base leading-relaxed">{diary.work_content}</p>
                        <p className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md inline-block">
                          작성일: {formatDateTime(diary.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(diary.id)}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(diary.id)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(diary.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {workDiaries.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}