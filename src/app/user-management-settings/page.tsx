'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Settings, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UserManagementSettingsPage() {
  const router = useRouter()

  const handleUserManagement = () => {
    router.push('/user-management')
  }

  const handleProjectManagement = () => {
    router.push('/project-management')
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>대시보드로 돌아가기</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리 및 설정</h1>
          <p className="text-gray-600 mt-2">사용자와 프로젝트를 관리할 수 있습니다.</p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 사용자 관리 카드 */}
          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100"
            onClick={handleUserManagement}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                사용자 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                사용자 계정, 권한, 부서 정보를 관리합니다.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• 사용자 추가/수정/삭제</p>
                <p>• 권한 레벨 설정</p>
                <p>• 부서 및 직책 관리</p>
              </div>
            </CardContent>
          </Card>

          {/* 프로젝트 관리 카드 */}
          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-green-300 bg-gradient-to-br from-green-50 to-green-100"
            onClick={handleProjectManagement}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                프로젝트 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                프로젝트 정보와 상태를 관리합니다.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• 프로젝트 추가/수정/삭제</p>
                <p>• 프로젝트 상태 관리</p>
                <p>• 프로젝트별 업무일지 연결</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추가 정보 */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              관리 기능 안내
            </h3>
            <p className="text-gray-600">
              각 카드를 클릭하여 해당 관리 페이지로 이동할 수 있습니다.
              <br />
              사용자 관리에서는 계정 정보를, 프로젝트 관리에서는 프로젝트 설정을 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
