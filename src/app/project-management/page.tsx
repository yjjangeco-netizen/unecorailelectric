'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import CommonHeader from '@/components/CommonHeader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  X
} from 'lucide-react'

interface Project {
  id: number
  projectName: string
  projectNumber: string
  assemblyDate: string
  factoryTestDate: string
  siteTestDate: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function ProjectManagementPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  
  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 폼 상태
  const [formData, setFormData] = useState({
    projectName: '',
    projectNumber: '',
    assemblyDate: '',
    factoryTestDate: '',
    siteTestDate: '',
    description: ''
  })

  // 인증 상태 확인
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Level5 이상 권한 확인
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const userLevel = user.level || '1'
      if (userLevel !== '5' && userLevel !== 'administrator') {
        router.push('/dashboard')
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  // 프로젝트 데이터 로드
  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('프로젝트 로드 실패')
      }
      const result = await response.json()
      setProjects(result || [])
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      // API 실패 시 빈 배열로 설정
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadProjects()
    }
  }, [isAuthenticated, authLoading, loadProjects])

  // 검색 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter(project => 
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }, [projects, searchTerm])

  // 프로젝트명 업데이트 함수
  const getUpdatedProjectName = (project: Project) => {
    let updatedName = project.projectName
    
    // 이미 "선반"이나 "전삭기"가 포함되어 있으면 추가하지 않음
    if (project.projectNumber && project.projectNumber.startsWith('CNCWL')) {
      if (!project.projectName.includes('선반')) {
        updatedName = `${project.projectName} 선반`
      }
    } else if (project.projectNumber && project.projectNumber.startsWith('CNCUWL')) {
      if (!project.projectName.includes('전삭기')) {
        updatedName = `${project.projectName} 전삭기`
      }
    }
    
    return updatedName
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      projectName: '',
      projectNumber: '',
      assemblyDate: '',
      factoryTestDate: '',
      siteTestDate: '',
      description: ''
    })
    setShowAddForm(false)
    setEditingProject(null)
  }

  // 프로젝트 추가
  const handleAdd = async () => {
    if (!formData.projectName.trim() || !formData.projectNumber.trim()) return
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectNumber: formData.projectNumber,
          assemblyDate: formData.assemblyDate,
          factoryTestDate: formData.factoryTestDate,
          siteTestDate: formData.siteTestDate,
          remarks: formData.description
        })
      })

      if (!response.ok) {
        throw new Error('프로젝트 추가 실패')
      }

      // 성공 시 목록 다시 로드
      await loadProjects()
      resetForm()
    } catch (error) {
      console.error('프로젝트 추가 실패:', error)
      alert('프로젝트 추가에 실패했습니다.')
    }
  }

  // 프로젝트 수정
  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      projectName: project.projectName,
      projectNumber: project.projectNumber,
      assemblyDate: project.assemblyDate,
      factoryTestDate: project.factoryTestDate,
      siteTestDate: project.siteTestDate,
      description: project.description
    })
    setShowAddForm(true)
  }

  // 프로젝트 업데이트
  const handleUpdate = async () => {
    if (!editingProject || !formData.projectName.trim() || !formData.projectNumber.trim()) return
    
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectNumber: formData.projectNumber,
          assemblyDate: formData.assemblyDate,
          factoryTestDate: formData.factoryTestDate,
          siteTestDate: formData.siteTestDate,
          remarks: formData.description
        })
      })

      if (!response.ok) {
        throw new Error('프로젝트 수정 실패')
      }

      // 성공 시 목록 다시 로드
      await loadProjects()
      resetForm()
    } catch (error) {
      console.error('프로젝트 수정 실패:', error)
      alert('프로젝트 수정에 실패했습니다.')
    }
  }

  // 프로젝트 삭제
  const handleDelete = async (projectId: number) => {
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('프로젝트 삭제 실패')
        }

        // 성공 시 목록 다시 로드
        await loadProjects()
      } catch (error) {
        console.error('프로젝트 삭제 실패:', error)
        alert('프로젝트 삭제에 실패했습니다.')
      }
    }
  }


  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      return '-'
    }
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

  // Level5 미만 사용자는 접근 불가
  if (user?.level !== '5' && user?.level !== 'administrator') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <CommonHeader
        currentUser={user}
        isAdmin={user?.level === 'administrator'}
        title="프로젝트 관리"
        backUrl="/settings"
        onLogout={() => router.push('/login')}
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트 관리</h1>
                <p className="text-gray-600">프로젝트를 생성, 수정, 관리합니다</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              프로젝트 추가
            </Button>
          </div>
        </div>

        {/* 프로젝트 추가/수정 모달 */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <DialogHeader className="bg-gradient-to-r from-green-100 to-emerald-100 -m-6 mb-4 p-6 rounded-t-lg">
              <DialogTitle className="flex items-center text-green-800 text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full flex items-center justify-center mr-3">
                  {editingProject ? <Edit className="h-5 w-5 text-green-600" /> : <Plus className="h-5 w-5 text-green-600" />}
                </div>
                {editingProject ? '프로젝트 수정' : '프로젝트 추가'}
              </DialogTitle>
              <DialogDescription className="text-green-700">
                {editingProject ? '프로젝트 정보를 수정합니다.' : '새로운 프로젝트를 추가합니다.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-green-700 font-medium">프로젝트명</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="mt-1 border-green-200 focus:border-green-400 bg-white text-gray-900"
                  placeholder="프로젝트명을 입력하세요"
                />
              </div>
              <div>
                <Label className="text-green-700 font-medium">프로젝트번호</Label>
                <Input
                  id="projectNumber"
                  value={formData.projectNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
                  className="mt-1 border-green-200 focus:border-green-400 bg-white text-gray-900"
                  placeholder="프로젝트번호를 입력하세요"
                />
              </div>
              <div>
                <Label className="text-green-700 font-medium">조완일</Label>
                <Input
                  id="assemblyDate"
                  type="date"
                  value={formData.assemblyDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, assemblyDate: e.target.value }))}
                  className="mt-1 border-green-200 focus:border-green-400"
                />
              </div>
              <div>
                <Label className="text-green-700 font-medium">공시일</Label>
                <Input
                  id="factoryTestDate"
                  type="date"
                  value={formData.factoryTestDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, factoryTestDate: e.target.value }))}
                  className="mt-1 border-green-200 focus:border-green-400"
                />
              </div>
              <div>
                <Label className="text-green-700 font-medium">현시일</Label>
                <Input
                  id="siteTestDate"
                  type="date"
                  value={formData.siteTestDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteTestDate: e.target.value }))}
                  className="mt-1 border-green-200 focus:border-green-400"
                />
              </div>
              <div>
                <Label className="text-green-700 font-medium">기타</Label>
                <Input
                  id="remarks"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 border-green-200 focus:border-green-400"
                  placeholder="기타 사항을 입력하세요"
                />
              </div>
            </div>
            
            <DialogFooter className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                취소
              </Button>
              <Button
                onClick={editingProject ? handleUpdate : handleAdd}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                {editingProject ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 프로젝트 목록 */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center justify-between mb-4">
              <div className="flex items-center text-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full flex items-center justify-center mr-3">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                </div>
                프로젝트 목록
              </div>
              <div className="text-sm text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                총 {filteredProjects.length}개
              </div>
            </CardTitle>
            
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="프로젝트명 또는 프로젝트번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 bg-white border-slate-300 focus:border-blue-400 focus:ring-blue-400"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-slate-600">로딩 중...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <Search className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm 
                    ? `"${searchTerm}"에 대한 검색 결과를 찾을 수 없습니다.`
                    : '새로운 프로젝트를 추가해보세요.'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    프로젝트 추가하기
                  </Button>
                )}
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    검색 초기화
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-200">
                      <th className="text-left p-3 font-semibold text-slate-800 w-32">프로젝트번호</th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-48">프로젝트명</th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">조완일</th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">공시일</th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">현시일</th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-40">기타</th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-24">수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600 text-sm font-mono">{project.projectNumber}</td>
                        <td className="p-3 text-slate-800 font-medium text-sm">{getUpdatedProjectName(project)}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.assemblyDate ? formatDate(project.assemblyDate) : '-'}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.factoryTestDate ? formatDate(project.factoryTestDate) : '-'}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.siteTestDate ? formatDate(project.siteTestDate) : '-'}</td>
                        <td className="p-3 text-slate-600 text-sm truncate" title={project.description || ''}>{project.description || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(project)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(project.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
