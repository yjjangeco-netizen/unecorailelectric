'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  Search
} from 'lucide-react'
import ProjectSearchModal from '@/components/ProjectSearchModal'

interface WorkEntry {
  id?: number
  projectId: string
  workContent: string
  workType: string // 신규, 보완, AS, SS, OV (WSMS 프로젝트만)
  workSubType: string // 출장, 외근, 전화 (WSMS 프로젝트만)
  customProjectName: string // 기타 프로젝트명
}

interface Project {
  id: number
  project_name: string
  project_number: string
  description?: string
}

export default function WorkDiaryWritePage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  
  // 상태 관리
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' }
  ])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [isProjectSearchOpen, setIsProjectSearchOpen] = useState(false)
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null)

  // 프로젝트명에 따른 작업유형/세부유형 설정 함수
  const getWorkTypeOptions = (projectName: string) => {
    const wsmsKeywords = ['cncwl', 'cncuwl', 'wsms', 'm&d', 'tandem', 'cncdwl']
    const hasWsmsKeyword = wsmsKeywords.some(keyword => 
      projectName.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (hasWsmsKeyword) {
      return {
        workTypes: ['신규', '보완', 'AS', 'SS', 'OV'],
        workSubTypes: ['출장', '외근', '전화']
      }
    }
    
    return {
      workTypes: [],
      workSubTypes: []
    }
  }

  // 프로젝트 선택 시 작업유형/세부유형 초기화
  const handleProjectSelect = (project: Project, index: number) => {
    const updated = [...workEntries]
    updated[index] = { 
      ...updated[index], 
      projectId: project.id.toString(),
      workType: '',
      workSubType: ''
    }
    setWorkEntries(updated)
  }

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

  // 프로젝트 목록 로드
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
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
          { id: 5, project_name: '덕하', project_number: 'CNCWL-1702', description: '덕하 DSL 프로젝트' },
          { id: 6, project_name: '고덕', project_number: 'CNCWL-1801', description: '고덕 DSL 프로젝트' },
          { id: 7, project_name: '대단', project_number: 'CNCWL-1901', description: '대단 Dsl 프로젝트' },
          { id: 8, project_name: '대전시설장비', project_number: 'CNCWL-2101', description: '대전시설장비 840D SL 프로젝트' },
          { id: 9, project_name: '시흥', project_number: 'CNCWL-2102', description: '시흥 Dsl 프로젝트' },
          { id: 10, project_name: '대단', project_number: 'CNCWL-2201', description: '대단 Fanuc 프로젝트' },
          { id: 11, project_name: 'GTX A', project_number: 'CNCWL-2202', description: 'GTX A 840D SL 프로젝트' },
          { id: 12, project_name: '호포', project_number: 'CNCWL-2301', description: '호포 840D sL 프로젝트' },
          { id: 13, project_name: '귤현', project_number: 'CNCWL-2302', description: '귤현 840D sL 프로젝트' },
          { id: 14, project_name: '인도네시아 PT.ABHIPRAYA', project_number: 'CNCWL-2304', description: '인도네시아 PT.ABHIPRAYA Fanuc 프로젝트' },
          { id: 15, project_name: '월배', project_number: 'CNCWL-2401', description: '월배 Fanuc 프로젝트' },
          { id: 16, project_name: '시흥2호기', project_number: 'CNCWL-2402', description: '시흥2호기 Sinuone 프로젝트' }
        ]
        setProjects(mockProjects)
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
    }
  }

  const addWorkEntry = () => {
    setWorkEntries([...workEntries, { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' }])
  }

  const removeWorkEntry = (index: number) => {
    if (workEntries.length > 1) {
      setWorkEntries(workEntries.filter((_, i) => i !== index))
    }
  }

  // 프로젝트 검색 모달 열기
  const openProjectSearch = (index: number) => {
    setCurrentSearchIndex(index)
    setIsProjectSearchOpen(true)
  }

  // 프로젝트 선택 처리
  const handleProjectSelectFromModal = (project: Project) => {
    if (currentSearchIndex !== null) {
      handleProjectSelect(project, currentSearchIndex)
    }
    setIsProjectSearchOpen(false)
    setCurrentSearchIndex(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const validEntries = workEntries.filter(entry => entry.projectId && entry.workContent.trim())
      
      if (validEntries.length === 0) {
        alert('최소 하나의 업무 내용을 입력해주세요.')
        return
      }

      console.log('업무일지 제출:', {
        date: workDate,
        entries: validEntries
      })

      // 각 업무 항목을 개별적으로 API에 전송
      for (const entry of validEntries) {
        const response = await fetch('/api/work-diary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id || 'unknown',
            workDate: workDate,
            projectId: entry.projectId === 'other' ? null : parseInt(entry.projectId),
            workContent: entry.workContent.trim(),
            workType: entry.workType,
            workSubType: entry.workSubType,
            customProjectName: entry.projectId === 'other' ? entry.customProjectName : null
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`업무일지 저장 실패: ${errorData.error || response.statusText}`)
        }
      }

      alert('업무일지가 성공적으로 등록되었습니다.')
      
      // 일일업무일지 메인 페이지로 이동
      router.push('/work-diary')
    } catch (error) {
      console.error('업무일지 제출 실패:', error)
      alert(`업무일지 제출 중 오류가 발생했습니다: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setWorkEntries([
      { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
      { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
      { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
      { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
      { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' }
    ])
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
          <div className="flex items-center mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/work-diary')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">업무일지 작성</h1>
              <p className="text-gray-600">일일 업무 내용을 작성하고 등록합니다</p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-gray-400 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-sky-100 rounded-t-lg border-b-2 border-gray-400">
            <CardTitle className="flex items-center text-black font-bold">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-200 to-sky-200 rounded-full flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              업무일지 작성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 날짜 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-black font-bold">작업 날짜</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    id="workDate"
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="pl-10 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-black bg-gradient-to-r from-blue-100 to-sky-100 px-3 py-2 rounded-md w-full border-2 border-gray-400">
                  <Clock className="h-4 w-4 inline mr-2" />
                  오늘 날짜가 기본으로 설정됩니다
                </div>
              </div>
            </div>

            {/* 출퇴근 시간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-black font-bold">출근 시간</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    type="time"
                    className="pl-10 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                    placeholder="09:00"
                  />
                </div>
              </div>
              <div>
                <Label className="text-black font-bold">퇴근 시간</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    type="time"
                    className="pl-10 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                    placeholder="18:00"
                  />
                </div>
              </div>
            </div>

            {/* 업무 내용 입력 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-black flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-200 to-sky-200 rounded-full flex items-center justify-center mr-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                업무 내용
              </h3>
              {workEntries.map((entry, index) => (
                <div key={index} className="border-2 border-gray-400 rounded-lg p-4 space-y-4 bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-black flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-200 to-sky-200 rounded-full flex items-center justify-center mr-2 text-xs font-bold text-blue-700">
                        {index + 1}
                      </div>
                      업무 {index + 1}
                    </h4>
                    {workEntries.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWorkEntry(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-red-400 hover:border-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 프로젝트 선택 */}
                    <div>
                      <Label className="text-black font-bold">프로젝트</Label>
                      <div className="flex space-x-2 mt-1">
                        {entry.projectId === 'other' ? (
                          <Input
                            value={entry.customProjectName}
                            onChange={(e) => {
                              const updated = [...workEntries]
                              updated[index] = { ...updated[index], customProjectName: e.target.value }
                              setWorkEntries(updated)
                            }}
                            placeholder="프로젝트명을 입력하세요"
                            className="flex-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                          />
                        ) : (
                          <Select
                            value={entry.projectId}
                            onValueChange={(value) => {
                              const updated = [...workEntries]
                              updated[index] = { 
                                ...updated[index], 
                                projectId: value,
                                workType: '',
                                workSubType: '',
                                customProjectName: value === 'other' ? entry.customProjectName : ''
                              }
                              setWorkEntries(updated)
                            }}
                          >
                            <SelectTrigger className="flex-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black">
                              <SelectValue placeholder="프로젝트를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.project_name} ({project.project_number})
                                </SelectItem>
                              ))}
                              <SelectItem value="other">기타</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {entry.projectId !== 'other' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openProjectSearch(index)}
                            className="bg-blue-50 border-2 border-gray-400 hover:bg-blue-100 hover:border-gray-600"
                          >
                            <Search className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 작업 유형 선택 */}
                    <div>
                      <Label className="text-black font-bold">작업 유형</Label>
                      {(() => {
                        if (!entry.projectId || entry.projectId === '') {
                          return (
                            <Input
                              id={`workType-${index}`}
                              value={entry.workType}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workType: e.target.value }
                                setWorkEntries(updated)
                              }}
                              placeholder="작업 유형을 입력하세요"
                              className="mt-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                            />
                          )
                        }
                        
                        const selectedProject = projects.find(p => p.id.toString() === entry.projectId)
                        const projectNumber = selectedProject?.project_number || ''
                        const workTypeOptions = getWorkTypeOptions(projectNumber)
                        
                        if (workTypeOptions.workTypes.length > 0) {
                          return (
                            <Select
                              value={entry.workType}
                              onValueChange={(value) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workType: value, workSubType: '' }
                                setWorkEntries(updated)
                              }}
                            >
                              <SelectTrigger className="mt-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black">
                                <SelectValue placeholder="작업 유형을 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                {workTypeOptions.workTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        } else {
                          return (
                            <Input
                              id={`workType-${index}`}
                              value={entry.workType}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workType: e.target.value }
                                setWorkEntries(updated)
                              }}
                              placeholder="작업 유형을 입력하세요"
                              className="mt-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                            />
                          )
                        }
                      })()}
                    </div>

                    {/* 세부 유형 선택 */}
                    <div>
                      <Label className="text-black font-bold">세부 유형</Label>
                      {(() => {
                        if (!entry.projectId || entry.projectId === '') {
                          return (
                            <Input
                              id={`workSubType-${index}`}
                              value={entry.workSubType}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workSubType: e.target.value }
                                setWorkEntries(updated)
                              }}
                              placeholder="세부 유형을 입력하세요"
                              className="mt-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                            />
                          )
                        }
                        
                        const selectedProject = projects.find(p => p.id.toString() === entry.projectId)
                        const projectNumber = selectedProject?.project_number || ''
                        const workTypeOptions = getWorkTypeOptions(projectNumber)
                        
                        if (workTypeOptions.workSubTypes.length > 0 && entry.workType) {
                          return (
                            <Select
                              value={entry.workSubType}
                              onValueChange={(value) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workSubType: value }
                                setWorkEntries(updated)
                              }}
                            >
                              <SelectTrigger className="mt-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black">
                                <SelectValue placeholder="세부 유형을 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                {workTypeOptions.workSubTypes.map((subType) => (
                                  <SelectItem key={subType} value={subType}>
                                    {subType}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        } else {
                          return (
                            <Input
                              id={`workSubType-${index}`}
                              value={entry.workSubType}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workSubType: e.target.value }
                                setWorkEntries(updated)
                              }}
                              placeholder="세부 유형을 입력하세요"
                              className="mt-1 bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                            />
                          )
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-black font-bold">업무 내용</Label>
                    <Textarea
                      id={`content-${index}`}
                      value={entry.workContent}
                      onChange={(e) => {
                        const updated = [...workEntries]
                        updated[index] = { ...updated[index], workContent: e.target.value }
                        setWorkEntries(updated)
                      }}
                      placeholder="업무 내용을 상세히 입력하세요"
                      className="mt-1 min-h-[100px] bg-white border-2 border-gray-400 focus:border-gray-600 text-black"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 추가 버튼 */}
            <Button
              variant="outline"
              onClick={addWorkEntry}
              className="w-full border-dashed border-2 border-gray-400 hover:border-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 text-black hover:text-black font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              업무 추가
            </Button>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-400">
              <Button
                variant="outline"
                onClick={resetForm}
                className="px-6 border-2 border-gray-400 text-black hover:bg-gray-50 hover:border-gray-600 font-bold"
              >
                초기화
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md px-6 font-bold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    등록 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    작성 완료
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프로젝트 검색 모달 */}
      <ProjectSearchModal
        isOpen={isProjectSearchOpen}
        onClose={() => setIsProjectSearchOpen(false)}
        onSelect={handleProjectSelectFromModal}
      />
    </div>
  )
}
