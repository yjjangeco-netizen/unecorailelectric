'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileText, ArrowLeft, Plus, Search, Download, Edit, Trash2 } from 'lucide-react'

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
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">유네코레일 전기파트</h1>
                <p className="text-sm text-gray-600">메뉴얼 관리 시스템</p>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/work-tool')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>업무툴로 돌아가기</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">메뉴얼 관리</h2>
          <p className="text-lg text-gray-600">
            업무 매뉴얼 및 가이드 문서를 관리합니다
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="메뉴얼 제목 또는 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? '전체' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* 새 메뉴얼 추가 */}
            <div className="flex items-end">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                새 메뉴얼 추가
              </Button>
            </div>
          </div>
        </div>

        {/* 메뉴얼 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManuals.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">v{item.version}</span>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>최종 수정: {item.lastUpdated}</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>다운로드</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>수정</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>삭제</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 검색 결과 없음 */}
        {filteredManuals.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              검색어: <span className="font-medium">"{searchTerm}"</span>
              {selectedCategory !== 'all' && (
                <> | 카테고리: <span className="font-medium">"{selectedCategory}"</span></>
              )}
            </p>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{manualItems.length}</div>
            <div className="text-sm text-gray-600">전체 메뉴얼</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {manualItems.filter(item => item.category === '점검').length}
            </div>
            <div className="text-sm text-gray-600">점검 매뉴얼</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {manualItems.filter(item => item.category === '안전').length}
            </div>
            <div className="text-sm text-gray-600">안전 매뉴얼</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {manualItems.filter(item => item.category === '조작').length}
            </div>
            <div className="text-sm text-gray-600">조작 매뉴얼</div>
          </div>
        </div>
      </main>
    </div>
  )
} 