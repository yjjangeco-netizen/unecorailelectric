'use client'


import { Button } from '@/components/ui/button'
import { Building2, User, Package, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">유네코레일</h1>
          </div>
          <h2 className="text-xl font-semibold text-blue-600">전기파트</h2>
          <p className="text-gray-600 mt-2">업무 관리 시스템</p>
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
              <p>인증 시스템은 현재 점검 중입니다.</p>
              <p>기본 페이지 기능을 테스트할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 