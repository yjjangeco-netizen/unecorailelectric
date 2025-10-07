'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, Check } from 'lucide-react'

interface Project {
  id: number
  name: string
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
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        alert('프로젝트 목록을 불러올 수 없습니다. 관리자에게 문의하세요.')
        setProjects([])
        setFilteredProjects([])
      }
    } catch (error) {
      alert('프로젝트 목록을 불러올 수 없습니다. 관리자에게 문의하세요.')
      setProjects([])
      setFilteredProjects([])
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
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-900">
                            {project.name}
                          </div>
                          <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                            {project.project_number}
                          </div>
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 line-clamp-2">
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
