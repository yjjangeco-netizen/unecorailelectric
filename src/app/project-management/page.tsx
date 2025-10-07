'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import CommonHeader from '@/components/CommonHeader'
import ProjectDetailModal from '@/components/ProjectDetailModal'
import SpecificationGenerator from '@/components/SpecificationGenerator'
import { Project } from '@/lib/types'
import { 
  ArrowLeft,
  Plus,
  Edit,
  FileText,
  BarChart3,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  X,
  Settings
} from 'lucide-react'

export default function ProjectManagementPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  
  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSpecGenerator, setShowSpecGenerator] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDemolishedProjects, setShowDemolishedProjects] = useState(false)
  const [showLatheProjects, setShowLatheProjects] = useState(true)
  const [showGrindingProjects, setShowGrindingProjects] = useState(true)
  const [statusFilters, setStatusFilters] = useState<string[]>(['Manufacturing', 'Demolished', 'Warranty', 'WarrantyComplete']) // 상태 필터 (체크박스)
  const [sortBy, setSortBy] = useState('project_number') // 정렬 기준
  const [sortOrder, setSortOrder] = useState('asc') // 정렬 순서
  
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

  // Level5 이상 권한 확인 (주석 처리 - 모든 사용자 접근 허용)
  // useEffect(() => {
  //   if (!authLoading && isAuthenticated && user) {
  //     const userLevel = user.level || '1'
  //     if (userLevel !== '5' && userLevel !== 'administrator') {
  //       router.push('/dashboard')
  //     }
  //   }
  // }, [authLoading, isAuthenticated, user, router])

  // 프로젝트 데이터 로드
  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('프로젝트 로드 실패')
      }
      const result = await response.json()
      // 프로젝트 번호로 정렬
      const sortedProjects = (result || []).sort((a: Project, b: Project) => {
        return a.project_number.localeCompare(b.project_number, undefined, { numeric: true })
      })
      setProjects(sortedProjects)
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

  // 검색 및 프로젝트 필터링
  useEffect(() => {
    let filtered = projects

    // 철거 프로젝트 필터링
    if (!showDemolishedProjects) {
      filtered = filtered.filter(project => {
        // status가 'demolished' 또는 'cancelled'이거나 프로젝트명에 '철거'가 포함된 경우 철거 프로젝트로 간주
        const isDemolished = project.status === 'demolished' || project.status === 'cancelled'
        const projectName = getUpdatedProjectName(project)
        const hasDemolishedInName = projectName.includes('철거')
        
        return !isDemolished && !hasDemolishedInName
      })
    }

    // 선반/전삭기 프로젝트 필터링
    filtered = filtered.filter(project => {
      const projectNumber = project.project_number || ''
      const isLathe = projectNumber.startsWith('CNCWL')
      const isGrinding = projectNumber.startsWith('CNCUWL')
      
      if (isLathe && !showLatheProjects) return false
      if (isGrinding && !showGrindingProjects) return false
      
      return true
    })

    // 상태 필터링 (체크박스)
    if (statusFilters.length > 0) {
      filtered = filtered.filter(project => {
        if (statusFilters.includes('Demolished')) {
          const projectName = getUpdatedProjectName(project)
          return statusFilters.includes(project.status) || projectName.includes('철거')
        }
        return statusFilters.includes(project.status)
      })
    }

    // 검색 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(project => 
        (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.project_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getUpdatedProjectName(project).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 정렬
    const sortedFiltered = filtered.sort((a: Project, b: Project) => {
      let aValue, bValue
      
      if (sortBy === 'project_number') {
        aValue = a.project_number || ''
        bValue = b.project_number || ''
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, undefined, { numeric: true })
          : bValue.localeCompare(aValue, undefined, { numeric: true })
      } else if (sortBy === 'name') {
        aValue = getUpdatedProjectName(a)
        bValue = getUpdatedProjectName(b)
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else if (sortBy === 'status') {
        aValue = getProjectStatusDisplay(a)
        bValue = getProjectStatusDisplay(b)
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else if (sortBy === 'assembly_date') {
        aValue = a.assembly_date || ''
        bValue = b.assembly_date || ''
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else if (sortBy === 'factory_test_date') {
        aValue = a.factory_test_date || ''
        bValue = b.factory_test_date || ''
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else if (sortBy === 'site_test_date') {
        aValue = a.site_test_date || ''
        bValue = b.site_test_date || ''
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else if (sortBy === 'completion_date') {
        aValue = a.completion_date || ''
        bValue = b.completion_date || ''
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })
    
    setFilteredProjects(sortedFiltered)
  }, [projects, searchTerm, showDemolishedProjects, showLatheProjects, showGrindingProjects, statusFilters, sortBy, sortOrder])

  // 상태 필터 체크박스 핸들러
  const handleStatusFilterChange = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // 프로젝트명 업데이트 함수 (현장명 생성)
  const getUpdatedProjectName = (project: Project) => {
    // 프로젝트명이 이미 있으면 그대로 사용
    if (project.name && project.name.trim() !== '') {
      return project.name
    }
    
    // 프로젝트번호를 기반으로 현장명 생성
    if (project.project_number) {
      const projectNumber = project.project_number
      
      // CNCWL 시리즈 - 선반 현장 (실제 현장명 매핑)
      if (projectNumber.startsWith('CNCWL')) {
        const number = projectNumber.replace('CNCWL-', '')
        
             // 실제 현장명 매핑 (이미지 기반)
             const siteNames: { [key: string]: string } = {
               '0902': '월배선반',
               '1501': '제천선반',
               '1601': '도봉선반',
               '1701': '군자선반',
               '1702': '덕하선반',
               '1801': '고덕선반',
               '1901': '대단선반',
               '2101': '대전시설장비',
               '2102': '시흥선반',
               '2201': '대단선반',
               '2202': 'GTX A',
               '2301': '호포선반',
               '2302': '귤현선반',
               '2401': '월배선반',
               '2402': '시흥2호기',
               '2501': '개화선반',
               '9201': '부단 철거',
               '9202': '신정 철거',
               '9301': '부단화차 철거',
               '9401': '서단(1호기) 철거',
               '9402': '분당 철거',
               '9403': '고덕 철거',
               '9404': '도봉 V4.5 철거',
               '9501': '대단(1호기) 철거',
               '9502': '군자 철거',
               '9601': '월배',
               '9602': '지축(1호기)',
               '9701': '서단(2호기) 철거',
               '9702': '호포 철거',
               '9703': '시흥',
               '9801': '부단(시설2호기)',
               '9802': '귤현 철거',
               '9901': '제천 V6.1',
               '9902': '부단(수송2호기)',
               '0001': '대단(2호기)'
             }
        
        return siteNames[number] || `선반 현장 ${number}`
      }
      // CNCUWL 시리즈 - 전삭기 현장 (실제 현장명 매핑)
      else if (projectNumber.startsWith('CNCUWL')) {
        const number = projectNumber.replace('CNCUWL-', '')
        
             // 실제 전삭기 현장명 매핑 (이미지 기반)
             const siteNames: { [key: string]: string } = {
               '9401': '월배전삭기',
               '9501': '모란전삭기',
               '9502': '도봉전삭기',
               '9601': '호포전삭기',
               '9602': '안심전삭기',
               '9603': '귤현전삭기',
               '9701': '천왕전삭기',
               '9801': '광양전삭기',
               '9802': '부곡전삭기',
               '9901': '신내전삭기',
               '0001': '광주전삭기',
               '0002': '이문전삭기',
               '0201': '창동전삭기',
               '0301': '판암전삭기',
               '0302': '문양전삭기',
               '0303': '지축전삭기',
               '0304': '대저전삭기',
               '0401': '분당전삭기',
               '0501': '노포전삭기',
               '0502': '영종전삭기',
               '0503': '문산전삭기',
               '0504': '개화전삭기',
               '0601': '신정전삭기',
               '0701': '김해전삭기',
               '0702': '당진전삭기',
               '0801': '제천전삭기',
               '0901': '평내전삭기',
               '1001': '용문전삭기',
               '1101': '인천2호선전삭기',
               '1206': '신분당전삭기',
               '1207': '브라질전삭기',
               '1301': '김포경전철전삭기',
               '1302': '소사원시_시흥전삭기',
               '1303': '고덕전삭기',
               '1401': '우이신설전삭기',
               '1402': '방화전삭기',
               '1501': '부발전삭기',
               '1502': '포스코전삭기',
               '1601': '천왕전삭기',
               '1602': '신평전삭기',
               '1603': '강릉전삭기',
               '1701': '도봉전삭기',
               '1702': '덕하전삭기',
               '1703': '자카르타전삭기',
               '1901': '수서전삭기',
               '1902': '호포전삭기',
               '1903': '가야전삭기',
               '2001': '귤현전삭기',
               '2002': '이문전삭기',
               '2101': '대구월배전삭기',
               '2102': '익산전삭기',
               '2103': '신내전삭기',
               '2104': '군자전삭기',
               '2201': 'GTX-A 파주전삭기',
               '2301': '병점동탄전삭기',
               '2401': '지축전삭기',
               '2501': '안심전삭기',
               '2502': '개화전삭기',
               '2506': '진접전삭기'
             }
        
        return siteNames[number] || `전삭기 현장 ${number}`
      }
      // 기타 프로젝트
      else {
        return `현장 ${projectNumber}`
      }
    }
    
    // 기본값
    return '미지정 현장'
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
          name: formData.projectName,
          project_number: formData.projectNumber,
          assembly_date: formData.assemblyDate,
          factory_test_date: formData.factoryTestDate,
          site_test_date: formData.siteTestDate,
          description: formData.description
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
  const handleDelete = async (projectId: string) => {
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

  // 프로젝트 상세 모달 열기
  const handleOpenDetailModal = (project: Project) => {
    setSelectedProject(project)
    setShowDetailModal(true)
  }

  // 프로젝트 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setSelectedProject(null)
    setShowDetailModal(false)
  }

  // 프로젝트 상세 정보 저장
  const handleSaveProjectDetail = async (project: Project) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project)
      })

      if (!response.ok) {
        throw new Error('프로젝트 수정 실패')
      }

      // 성공 시 목록 다시 로드
      await loadProjects()
      handleCloseDetailModal()
    } catch (error) {
      console.error('프로젝트 수정 실패:', error)
      alert('프로젝트 수정에 실패했습니다.')
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

  // 프로젝트 상태 표시 함수
  const getProjectStatusDisplay = (project: Project) => {
    if (project.status === 'Warranty' && project.completion_date && project.warranty_period) {
      return `하자보증중 (~${project.warranty_period})`
    }
    
    const statusMap: { [key: string]: string } = {
      'Manufacturing': '제작중',
      'Demolished': '철거',
      'Warranty': '하자보증중',
      'WarrantyComplete': '하자보증완료'
    }
    
    // 프로젝트명에 '철거'가 포함된 경우 철거로 표시 (데이터베이스 상태보다 우선)
    const projectName = getUpdatedProjectName(project)
    if (projectName.includes('철거')) {
      return '철거'
    }
    
    // 데이터베이스 상태 반영
    if (project.status && statusMap[project.status]) {
      return statusMap[project.status]
    }
    
    return '제작중'
  }

  // 프로젝트 상태 변경 핸들러
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('상태 변경 실패')
      }

      // 성공 시 목록 다시 로드
      await loadProjects()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
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

  // Level5 미만 사용자는 접근 불가 (주석 처리 - 모든 사용자 접근 허용)
  // if (user?.level !== '5' && user?.level !== 'administrator') {
  //   return null
  // }

  return (
    <AuthGuard requiredLevel={3}>
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
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSpecGenerator(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md"
              >
                <FileText className="h-4 w-4 mr-2" />
                사양서 출력
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                프로젝트 추가
              </Button>
            </div>
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
            
            {/* 검색 및 필터 */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
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
              
              {/* 프로젝트 필터 및 정렬 컨트롤 */}
              <div className="flex items-center space-x-4 flex-wrap">
                {/* 상태 필터 (체크박스) */}
                <div className="flex items-center space-x-4">
                  <Label className="text-sm text-slate-700 font-medium">상태:</Label>
                  <div className="flex space-x-3">
                    {[
                      { value: 'Manufacturing', label: '제작중' },
                      { value: 'Demolished', label: '철거' },
                      { value: 'Warranty', label: '하자보증중' },
                      { value: 'WarrantyComplete', label: '하자보증완료' }
                    ].map((status) => (
                      <label key={status.value} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilters.includes(status.value)}
                          onChange={() => handleStatusFilterChange(status.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 정렬 기준 */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-700 font-medium">정렬:</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="project_number">프로젝트번호</option>
                    <option value="name">프로젝트명</option>
                    <option value="status">상태</option>
                    <option value="assembly_date">조립완료일</option>
                    <option value="factory_test_date">공장시운전일</option>
                    <option value="site_test_date">현장시운전일</option>
                    <option value="completion_date">준공완료일</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 border border-slate-300 rounded-md text-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* 프로젝트 타입 필터 */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showLathe"
                      checked={showLatheProjects}
                      onChange={(e) => setShowLatheProjects(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="showLathe" className="text-sm text-slate-700 cursor-pointer">
                      선반
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showGrinding"
                      checked={showGrindingProjects}
                      onChange={(e) => setShowGrindingProjects(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="showGrinding" className="text-sm text-slate-700 cursor-pointer">
                      전삭기
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showDemolished"
                      checked={showDemolishedProjects}
                      onChange={(e) => setShowDemolishedProjects(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="showDemolished" className="text-sm text-slate-700 cursor-pointer">
                      철거 프로젝트 보기
                    </Label>
                  </div>
                </div>
              </div>
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
                      <th className="text-left p-3 font-semibold text-slate-800 w-32">
                        <button
                          onClick={() => {
                            if (sortBy === 'project_number') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('project_number')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>프로젝트번호</span>
                          {sortBy === 'project_number' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-48">
                        <button
                          onClick={() => {
                            if (sortBy === 'name') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('name')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>프로젝트명</span>
                          {sortBy === 'name' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">
                        <button
                          onClick={() => {
                            if (sortBy === 'status') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('status')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>상태</span>
                          {sortBy === 'status' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">
                        <button
                          onClick={() => {
                            if (sortBy === 'assembly_date') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('assembly_date')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>조립완료일</span>
                          {sortBy === 'assembly_date' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">
                        <button
                          onClick={() => {
                            if (sortBy === 'factory_test_date') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('factory_test_date')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>공장시운전일</span>
                          {sortBy === 'factory_test_date' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">
                        <button
                          onClick={() => {
                            if (sortBy === 'site_test_date') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('site_test_date')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>현장시운전일</span>
                          {sortBy === 'site_test_date' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-28">
                        <button
                          onClick={() => {
                            if (sortBy === 'completion_date') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy('completion_date')
                              setSortOrder('asc')
                            }
                          }}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>준공완료일</span>
                          {sortBy === 'completion_date' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-800 w-20">설정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600 text-sm font-mono">{project.project_number}</td>
                        <td className="p-3 text-slate-800 font-medium text-sm">{getUpdatedProjectName(project)}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">
                          <select
                            value={project.status}
                            onChange={(e) => handleStatusChange(project.id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${
                              project.status === 'Warranty' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'WarrantyComplete' ? 'bg-green-100 text-green-800' :
                              project.status === 'Demolished' ? 'bg-red-100 text-red-800' :
                              project.status === 'Manufacturing' ? 'bg-yellow-100 text-yellow-800' :
                              // 프로젝트명에 '철거'가 포함된 경우 빨간색으로 표시
                              getUpdatedProjectName(project).includes('철거') ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <option value="Manufacturing">제작중</option>
                            <option value="Demolished">철거</option>
                            <option value="Warranty">하자보증중</option>
                            <option value="WarrantyComplete">하자보증완료</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.assembly_date ? formatDate(project.assembly_date) : '-'}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.factory_test_date ? formatDate(project.factory_test_date) : '-'}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.site_test_date ? formatDate(project.site_test_date) : '-'}</td>
                        <td className="p-3 text-slate-600 text-sm text-left">{project.completion_date ? formatDate(project.completion_date) : '-'}</td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetailModal(project)}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            title="설정"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 프로젝트 상세 모달 */}
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          onSave={handleSaveProjectDetail}
        />

        {/* 사양서 생성기 모달 */}
        <SpecificationGenerator
          isOpen={showSpecGenerator}
          onClose={() => setShowSpecGenerator(false)}
          projectData={{
            id: 0,
            projectName: '새 프로젝트',
            projectNumber: 'NEW-001',
            description: ''
          }}
        />
      </div>
    </div>
    </AuthGuard>
  )
}
