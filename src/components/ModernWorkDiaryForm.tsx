'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  User, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Save, 
  BarChart3,
  Timer,
  Target,
  CheckCircle,
  AlertCircle,
  FileText,
  Search
} from 'lucide-react'

interface WorkEntry {
  id: string
  projectId: string
  projectName: string
  workContent: string
  workType: string
  workSubType: string
  startTime: string
  endTime: string
  duration: number // 분 단위
  customProjectName: string
}

interface Project {
  id: string
  name: string
  number: string
  description?: string
}

interface ModernWorkDiaryFormProps {
  onSubmit: (data: any) => void
  projects?: Project[]
}

export default function ModernWorkDiaryForm({ 
  onSubmit, 
  projects = []
}: ModernWorkDiaryFormProps) {
  const [formData, setFormData] = useState({
    workDate: new Date().toISOString().split('T')[0],
    totalHours: 0,
    notes: ''
  })
  
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([
    {
      id: '1',
      projectId: '',
      projectName: '',
      workContent: '',
      workType: '',
      workSubType: '',
      startTime: '09:00',
      endTime: '18:00',
      duration: 0,
      customProjectName: ''
    }
  ])

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)

  // 시간 계산 함수
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    return Math.max(0, Math.round(diffMs / (1000 * 60))) // 분 단위
  }

  // 총 작업 시간 계산
  const totalWorkMinutes = workEntries.reduce((sum, entry) => sum + entry.duration, 0)
  const totalHours = Math.floor(totalWorkMinutes / 60)
  const remainingMinutes = totalWorkMinutes % 60

  // 작업 항목 추가
  const addWorkEntry = () => {
    const newEntry: WorkEntry = {
      id: Date.now().toString(),
      projectId: '',
      projectName: '',
      workContent: '',
      workType: '',
      workSubType: '',
      startTime: '09:00',
      endTime: '18:00',
      duration: 0,
      customProjectName: ''
    }
    setWorkEntries([...workEntries, newEntry])
  }

  // 작업 항목 삭제
  const removeWorkEntry = (id: string) => {
    if (workEntries.length > 1) {
      setWorkEntries(workEntries.filter(entry => entry.id !== id))
    }
  }

  // 작업 항목 업데이트
  const updateWorkEntry = (id: string, field: keyof WorkEntry, value: string) => {
    setWorkEntries(workEntries.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry, [field]: value }
        
        // 시간이 변경되면 duration 재계산
        if (field === 'startTime' || field === 'endTime') {
          updatedEntry.duration = calculateDuration(updatedEntry.startTime, updatedEntry.endTime)
        }
        
        return updatedEntry
      }
      return entry
    }))
  }

  // 프로젝트 선택
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
    setShowProjectModal(false)
  }

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      workEntries: workEntries.filter(entry => entry.workContent.trim() !== ''),
      totalHours: totalHours,
      totalMinutes: remainingMinutes
    }
    onSubmit(data)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">업무일지 작성</h1>
        <p className="text-gray-600">오늘의 작업 내용을 기록하고 통계를 확인하세요</p>
      </div>

      {/* 기본 정보 카드 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="workDate">작업일</Label>
              <Input
                id="workDate"
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData(prev => ({ ...prev, workDate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>총 작업 시간</Label>
              <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">
                    {totalHours}시간 {remainingMinutes}분
                  </span>
                </div>
              </div>
            </div>
            <div>
              <Label>작업 항목 수</Label>
              <div className="mt-1 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    {workEntries.filter(entry => entry.workContent.trim() !== '').length}개
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 작업 항목들 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">작업 항목</h2>
          <Button onClick={addWorkEntry} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            항목 추가
          </Button>
        </div>

        {workEntries.map((entry, index) => (
          <Card key={entry.id} className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">작업 항목 {index + 1}</CardTitle>
                {workEntries.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWorkEntry(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 프로젝트 선택 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>프로젝트</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={entry.projectId}
                      onValueChange={(value) => {
                        const project = projects.find(p => p.id === value)
                        updateWorkEntry(entry.id, 'projectId', value)
                        updateWorkEntry(entry.id, 'projectName', project?.name || '')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} ({project.number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProjectModal(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>기타 프로젝트명</Label>
                  <Input
                    value={entry.customProjectName}
                    onChange={(e) => updateWorkEntry(entry.id, 'customProjectName', e.target.value)}
                    placeholder="기타 프로젝트명 입력"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 작업 내용 */}
              <div>
                <Label>작업 내용</Label>
                <Textarea
                  value={entry.workContent}
                  onChange={(e) => updateWorkEntry(entry.id, 'workContent', e.target.value)}
                  placeholder="오늘 수행한 작업 내용을 상세히 기록하세요"
                  className="mt-1 min-h-[100px]"
                />
              </div>

              {/* 작업 유형 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>작업 유형</Label>
                  <Select
                    value={entry.workType}
                    onValueChange={(value) => updateWorkEntry(entry.id, 'workType', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="작업 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="신규">신규</SelectItem>
                      <SelectItem value="보완">보완</SelectItem>
                      <SelectItem value="AS">AS</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                      <SelectItem value="OV">OV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>세부 유형</Label>
                  <Select
                    value={entry.workSubType}
                    onValueChange={(value) => updateWorkEntry(entry.id, 'workSubType', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="세부 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="출장">출장</SelectItem>
                      <SelectItem value="외근">외근</SelectItem>
                      <SelectItem value="전화">전화</SelectItem>
                      <SelectItem value="온라인">온라인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 시간 입력 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => updateWorkEntry(entry.id, 'startTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => updateWorkEntry(entry.id, 'endTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>소요 시간</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-700">
                        {Math.floor(entry.duration / 60)}시간 {entry.duration % 60}분
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 메모 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>메모</CardTitle>
          <CardDescription>추가적인 사항이나 특이사항을 기록하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="특이사항이나 추가 메모를 입력하세요"
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" size="lg">
          임시저장
        </Button>
        <Button onClick={handleSubmit} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Save className="w-4 h-4 mr-2" />
          저장하기
        </Button>
      </div>
    </div>
  )
}
