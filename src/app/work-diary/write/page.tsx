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
  id?: number | undefined
  projectId: string
  workContent: string
  workType: string // 신규, 보완, AS, SS, OV (WSMS 프로젝트만)
  workSubType: string // 출장, 외근, 전화 (WSMS 프로젝트만)
  customProjectName: string // 기타 프로젝트명
  startTime?: string // 출근시간 (HH:MM)
  endTime?: string // 퇴근시간 (HH:MM)
  workHours?: number // 계산된 근무시간 (퇴근시간 - 출근시간 - 1시간)
  overtimeHours?: number // 초과근무시간
}

interface Project {
  id: number
  name: string
  project_number: string
  description?: string
}

export default function WorkDiaryWritePage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()

  // 상태 관리
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyStartTime, setDailyStartTime] = useState('09:00')
  const [dailyEndTime, setDailyEndTime] = useState('18:00')
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' },
    { projectId: '', workContent: '', workType: '', workSubType: '', customProjectName: '' }
  ])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [isProjectSearchOpen, setIsProjectSearchOpen] = useState(false)
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null)

  // 근무시간 계산 함수 (퇴근시간 - 출근시간 - 1시간)
  const calculateWorkHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0

    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)

    // 퇴근시간이 출근시간보다 이른 경우 (다음날까지 일한 경우)
    if (end < start) {
      end.setDate(end.getDate() + 1)
    }

    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // 점심시간 1시간 제외
    const workHours = Math.max(0, diffHours - 1)

    return Math.round(workHours * 10) / 10 // 소수점 첫째자리까지
  }

  // 프로젝트명에 따른 작업유형/세부유형 설정 함수
  const getWorkTypeOptions = (projectName: string) => {
    const wsmsKeywords = ['cncwl', 'cncuwl', 'wsms', 'm&d', 'tandem', 'cncdwl']
    const hasWsmsKeyword = wsmsKeywords.some(keyword =>
      projectName.toLowerCase().includes(keyword.toLowerCase())
    )

    if (hasWsmsKeyword) {
      return {
        workTypes: ['신규', '보완', 'AS', 'SS', 'OV'],
        workSubTypes: ['내근', '출장', '외근', '전화']
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
      workSubType: '',
      workContent: updated[index]?.workContent || '',
      customProjectName: updated[index]?.customProjectName || ''
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
      const userLevel = String(user.level || '1')
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
        alert('프로젝트 목록을 불러올 수 없습니다. 관리자에게 문의하세요.')
      }
    } catch (error) {
      alert('프로젝트 목록을 불러올 수 없습니다. 관리자에게 문의하세요.')
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
            customProjectName: entry.projectId === 'other' ? entry.customProjectName : null,
            startTime: dailyStartTime,
            endTime: dailyEndTime
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
      alert(`업무일지 제출 중 오류가 발생했습니다: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setDailyStartTime('09:00')
    setDailyEndTime('18:00')
    setWorkEntries([
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
  if (String(user?.level || '1') === '1') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}


        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8 space-y-8">
            {/* 상단: 날짜 및 시간 설정 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">작업 날짜</Label>
                <Input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">출근 시간</Label>
                <Input
                  type="time"
                  value={dailyStartTime}
                  onChange={(e) => setDailyStartTime(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">퇴근 시간</Label>
                <Input
                  type="time"
                  value={dailyEndTime}
                  onChange={(e) => setDailyEndTime(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 my-6"></div>

            {/* 업무 내용 입력 */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">업무 내용</h3>
                <span className="text-sm text-gray-500">총 {workEntries.length}건의 업무</span>
              </div>
              
              {workEntries.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <span className="bg-white border border-gray-200 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 text-gray-600">
                        {index + 1}
                      </span>
                      업무 내용
                    </h4>
                    {workEntries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkEntry(index)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* 프로젝트 선택 (4/12) */}
                      <div className="md:col-span-4 space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500">프로젝트</Label>
                        <div className="flex space-x-2">
                          {entry.projectId === 'other' ? (
                            <Input
                              value={entry.customProjectName}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = {
                                  ...updated[index],
                                  customProjectName: e.target.value
                                }
                                setWorkEntries(updated)
                              }}
                              placeholder="프로젝트명 입력"
                              className="bg-white h-9"
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
                              <SelectTrigger className="bg-white h-9">
                                <SelectValue placeholder="프로젝트 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id.toString()}>
                                    {project.name}
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
                              className="shrink-0 h-9 w-9"
                            >
                              <Search className="h-4 w-4 text-gray-500" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 작업 유형 (2/12) */}
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500">작업 유형</Label>
                        {(() => {
                          const selectedProject = projects.find(p => p.id.toString() === entry.projectId)
                          const workTypeOptions = getWorkTypeOptions(selectedProject?.project_number || '')
                          
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
                                <SelectTrigger className="bg-white h-9">
                                  <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {workTypeOptions.workTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )
                          }
                          return (
                            <Input
                              value={entry.workType}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workType: e.target.value }
                                setWorkEntries(updated)
                              }}
                              className="bg-white h-9"
                            />
                          )
                        })()}
                      </div>

                      {/* 세부 유형 (2/12) */}
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500">세부 유형</Label>
                        {(() => {
                          const selectedProject = projects.find(p => p.id.toString() === entry.projectId)
                          const workTypeOptions = getWorkTypeOptions(selectedProject?.project_number || '')
                          
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
                                <SelectTrigger className="bg-white h-9">
                                  <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {workTypeOptions.workSubTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )
                          }
                          return (
                            <Input
                              value={entry.workSubType}
                              onChange={(e) => {
                                const updated = [...workEntries]
                                updated[index] = { ...updated[index], workSubType: e.target.value }
                                setWorkEntries(updated)
                              }}
                              className="bg-white h-9"
                            />
                          )
                        })()}
                      </div>

                      {/* 업무 내용 (4/12) */}
                      <div className="md:col-span-4 space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500">상세 내용</Label>
                        <Textarea
                          value={entry.workContent}
                          onChange={(e) => {
                            const updated = [...workEntries]
                            updated[index] = { ...updated[index], workContent: e.target.value }
                            setWorkEntries(updated)
                          }}
                          placeholder="업무 내용을 입력하세요 (엔터로 줄바꿈)"
                          className="bg-white min-h-[38px] resize-y"
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 버튼 영역 */}
            <div className="pt-4 space-y-4">
              <Button
                variant="outline"
                onClick={addWorkEntry}
                className="w-full border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                항목 추가
              </Button>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={resetForm}
                  className="text-gray-500 hover:bg-gray-100"
                >
                  초기화
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {loading ? '저장 중...' : '저장하기'}
                </Button>
              </div>
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
