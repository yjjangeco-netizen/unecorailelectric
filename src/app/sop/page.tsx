'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Search, Plus, Edit, Trash2, Download, Upload, BookOpen, Settings, User } from 'lucide-react'

export default function SOPPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // SOP 카테고리 목록
  const categories = [
    { id: 'all', name: '전체', count: 25 },
    { id: 'safety', name: '안전관리', count: 8 },
    { id: 'operation', name: '운영절차', count: 12 },
    { id: 'maintenance', name: '정비절차', count: 5 }
  ]

  // SOP 문서 목록 (예시 데이터)
  const sopDocuments = [
    {
      id: 1,
      title: '전기설비 안전작업 절차',
      category: 'safety',
      categoryName: '안전관리',
      version: 'v2.1',
      lastUpdated: '2024-01-15',
      author: '김전기',
      status: 'active'
    },
    {
      id: 2,
      title: '변압기 점검 및 유지보수',
      category: 'maintenance',
      categoryName: '정비절차',
      version: 'v1.8',
      lastUpdated: '2024-01-10',
      author: '박정비',
      status: 'active'
    },
    {
      id: 3,
      title: '전력공급 시스템 운영절차',
      category: 'operation',
      categoryName: '운영절차',
      version: 'v3.0',
      lastUpdated: '2024-01-08',
      author: '이운영',
      status: 'active'
    },
    {
      id: 4,
      title: '비상전원 차단 절차',
      category: 'safety',
      categoryName: '안전관리',
      version: 'v1.5',
      lastUpdated: '2024-01-05',
      author: '김전기',
      status: 'active'
    },
    {
      id: 5,
      title: '전기계측기 교정절차',
      category: 'maintenance',
      categoryName: '정비절차',
      version: 'v2.2',
      lastUpdated: '2024-01-03',
      author: '박정비',
      status: 'active'
    }
  ]

  // 검색 및 필터링
  const filteredDocuments = sopDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">SOP (표준작업절차)</h1>
            </div>
            
            {/* 우측: 메인으로 돌아가기 버튼 */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/stock-management')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>재고관리로</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">총 SOP 문서</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">25</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">활성 문서</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">검토 필요</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">최근 업데이트</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">3일 전</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900">SOP 문서 검색</h2>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              {/* 카테고리 선택 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
              
              {/* 검색창 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="SOP 문서 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              
              {/* 새 SOP 작성 버튼 */}
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 SOP 작성
              </Button>
            </div>
          </div>
        </div>

        {/* SOP 문서 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              SOP 문서 목록 ({filteredDocuments.length}개)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    버전
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최종수정일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {doc.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {doc.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📋 SOP (Standard Operating Procedure)
            </h3>
            <p className="text-blue-700 mb-4">
              표준작업절차는 업무의 일관성과 품질을 보장하기 위한 중요한 문서입니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-600">
              <div>
                <strong>안전관리:</strong> 전기작업 안전수칙 및 비상대응절차
              </div>
              <div>
                <strong>운영절차:</strong> 일상적인 전력시스템 운영방법
              </div>
              <div>
                <strong>정비절차:</strong> 설비 점검 및 유지보수 방법
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
