'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, Check } from 'lucide-react'

interface Project {
  id: number
  project_name: string
  project_number: string
  description?: string
}

interface ProjectSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (project: Project) => void
}

export default function ProjectSearchModal({ isOpen, onClose, onSelect }: ProjectSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // 프로젝트 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  // 검색 필터링
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter(project =>
        project.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }, [searchQuery, projects])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        setFilteredProjects(data)
      } else {
        console.error('프로젝트 로드 실패:', response.statusText)
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
        setFilteredProjects(mockProjects)
      }
    } catch (error) {
      console.error('프로젝트 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (project: Project) => {
    onSelect(project)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <Search className="h-5 w-5 text-blue-600" />
            <span>프로젝트 검색</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="프로젝트명, 프로젝트번호, 설명으로 검색..."
              className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* 검색 결과 */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                프로젝트를 불러오는 중...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                {searchQuery ? '검색 결과가 없습니다.' : '프로젝트가 없습니다.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project)}
                    className="w-full p-4 text-left hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-900">
                          {project.project_name}
                        </div>
                        <div className="text-sm font-medium text-blue-600 mt-1">
                          {project.project_number}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {project.description}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <Check className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              onClick={onClose} 
              variant="outline"
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
