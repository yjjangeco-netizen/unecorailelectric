'use client'

import { Button } from '@/components/ui/button'
import { Building2, User, Package, BookOpen, FileText, Settings, Database, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">유네코레일</h1>
          </div>
          <h2 className="text-xl font-semibold text-blue-600">전기파트</h2>
          <p className="text-gray-600 mt-2">업무 관리 시스템</p>
        </div>

        {/* 메인 기능 카드 */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="text-center pb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>주요 기능</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link href="/stock-management">
              <Button className="w-full h-20" variant="outline">
                <div className="text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-sm font-medium">재고관리</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/sop">
              <Button className="w-full h-20" variant="outline">
                <div className="text-center">
                  <ClipboardList className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">SOP</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/work-diary">
              <Button className="w-full h-20" variant="outline">
                <div className="text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-sm font-medium">업무일지</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/manual-management">
              <Button className="w-full h-20" variant="outline">
                <div className="text-center">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">메뉴얼관리</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* 테스트 카드 */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center pb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>시스템 테스트</span>
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-100 border border-green-300 rounded">
              <p className="text-green-800 text-center">✅ 기본 페이지 렌더링 성공!</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Link href="/simple">
                <Button className="w-full" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  간단 테스트
                </Button>
              </Link>
              
              <Link href="/test-simple">
                <Button className="w-full" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  테스트 페이지
                </Button>
              </Link>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>💡 위의 주요 기능 버튼을 클릭하여 각 기능을 테스트할 수 있습니다.</p>
              <p>🔐 재고관리 페이지에서 로그인하여 모든 기능을 이용하세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 