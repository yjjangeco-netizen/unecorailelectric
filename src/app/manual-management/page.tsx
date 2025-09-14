'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CommonHeader from '@/components/CommonHeader'
import { Building2, FileText, ArrowLeft, Plus, Search, Download, Edit } from 'lucide-react'

interface ManualItem {
  id: string
  title: string
  category: string
  version: string
  lastUpdated: string
  description: string
}

export default function ManualManagementPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; level: string } | null>(null)

  useEffect(() => {
    // 로그인 상태 확인
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setCurrentUser({
          id: userData.id || userData.username,
          name: userData.name,
          level: userData.level || '1'
        })
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error)
      }
    }
  }, [])

  // 샘플 메뉴얼 데이터
  const manualItems: ManualItem[] = [
    {
      id: '1',
      title: '전기 설비 점검 매뉴얼',
      category: '점검',
      version: 'v2.1',
      lastUpdated: '2024-01-15',
      description: '전기 설비 정기 점검 및 유지보수 절차'
    },
    {
      id: '2',
      title: '안전 작업 가이드',
      category: '안전',
      version: 'v1.8',
      lastUpdated: '2024-01-10',
      description: '전기 작업 시 안전 수칙 및 주의사항'
    },
    {
      id: '3',
      title: '장비 조작 매뉴얼',
      category: '조작',
      version: 'v3.0',
      lastUpdated: '2024-01-20',
      description: '주요 전기 장비 조작 방법 및 절차'
    }
  ]

  // 카테고리 필터링
  const categories = ['all', '점검', '안전', '조작', '기타']
  
  // 검색 및 필터링
  const filteredManuals = manualItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 공통 헤더 추가 */}
      <CommonHeader
        currentUser={currentUser}
        isAdmin={currentUser?.level === 'administrator' || currentUser?.level === '5'}
        title="메뉴얼 관리"
        backUrl="/work-tool"
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">메뉴얼 관리</h2>
          <p className="text-lg text-gray-600">
            업무 매뉴얼 및 가이드 문서를 관리합니다
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 검색창 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="메뉴얼 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            {/* 카테고리 선택 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '전체' : category}
                </option>
              ))}
            </select>
            
            {/* 새 메뉴얼 작성 버튼 */}
            <Button
              size="sm"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 메뉴얼 작성
            </Button>
          </div>
        </div>

        {/* 메뉴얼 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredManuals.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {item.category}
                      </span>
                      <span>v{item.version}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {item.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>최종수정: {item.lastUpdated}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="h-3 w-3 mr-1" />
                    보기
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    다운로드
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    편집
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 검색 결과 없음 */}
        {filteredManuals.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-sm text-gray-600">
                {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '등록된 메뉴얼이 없습니다.'}
                <br />
                검색어를 변경하거나 새 메뉴얼을 작성해보세요.
              </p>
            </div>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
              📊 메뉴얼 통계
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-700">
              <div>
                <strong>전체:</strong> {manualItems.length}개
              </div>
              <div>
                <strong>검색 결과:</strong> {filteredManuals.length}개
              </div>
              <div>
                <strong>카테고리:</strong> {categories.length - 1}개
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 