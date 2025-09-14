'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import CommonHeader from '@/components/CommonHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FolderOpen, 
  Settings as SettingsIcon,
  ArrowRight,
  BarChart3
} from 'lucide-react'

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    console.log('설정 - 사용자 상태:', { user, isAuthenticated, authLoading })
    
    // localStorage에서 직접 사용자 정보 확인
    const storedUser = localStorage.getItem('user')
    console.log('설정 - localStorage 직접 확인:', storedUser)
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        console.log('설정 - localStorage 사용자 데이터:', userData)
        // localStorage에 사용자 정보가 있으면 페이지 표시
        if (userData && userData.id && userData.username) {
          console.log('설정 - localStorage 기반 인증 확인, 페이지 표시')
          return
        }
      } catch (err) {
        console.error('localStorage 파싱 오류:', err)
      }
    }
    
    // 로딩이 완료되고 인증되지 않은 경우에만 리다이렉트
    if (!authLoading && !isAuthenticated && !storedUser) {
      console.log('설정 - 로그인 페이지로 리다이렉트')
      router.push('/login')
    } else if (isAuthenticated) {
      console.log('설정 - 인증된 사용자, 페이지 표시')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const handleUserManagement = () => {
    router.push('/user-management')
  }

  const handleProjectManagement = () => {
    router.push('/project-management')
  }

  const handleNaraSettings = () => {
    router.push('/nara-settings')
  }

  return (
    <div className="min-h-screen bg-white">
      <CommonHeader
        currentUser={user}
        isAdmin={user?.level === 'admin'}
        title="설정"
        backUrl="/"
        onLogout={() => router.push('/login')}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">
            시스템 설정 및 관리 기능을 선택하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 회원관리 카드 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                onClick={handleUserManagement}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">회원관리</h3>
                  <p className="text-gray-600 text-sm">
                    사용자 계정 관리 및 권한 설정
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Card>

          {/* 프로젝트 관리 카드 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                onClick={handleProjectManagement}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FolderOpen className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">프로젝트 관리</h3>
                  <p className="text-gray-600 text-sm">
                    프로젝트 생성, 수정 및 진행 상황 관리
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
          </Card>

          {/* 입찰모니터링 관리 카드 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                onClick={handleNaraSettings}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">입찰모니터링 관리</h3>
                  <p className="text-gray-600 text-sm">
                    Nara 입찰 모니터링 설정 및 관리
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Card>
        </div>

        {/* 추가 설정 옵션들 */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">기타 설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">시스템 설정</h4>
                  <p className="text-sm text-gray-500">준비 중</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">알림 설정</h4>
                  <p className="text-sm text-gray-500">준비 중</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">보안 설정</h4>
                  <p className="text-sm text-gray-500">준비 중</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
