'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, User, Lock, FileText, Package, BookOpen, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const router = useRouter()

  // 페이지 로드 시 localStorage에서 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setCurrentUser(userData.username)
        console.log('메인 페이지에서 로그인 상태 복원:', userData)
      } catch (error) {
        console.error('저장된 사용자 정보 파싱 오류:', error)
        localStorage.removeItem('currentUser')
      }
    }
  }, [])

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 일반 사용자 로그인 처리
      if (username && password) {
        // 여기서 실제 인증 로직을 구현할 수 있습니다
        // 현재는 간단한 예시로 처리
        const userRole = getDefaultRole(username)
        const userData = {
          username: username,
          name: username,
          role: userRole === 'admin' ? '관리자' : userRole === 'manager' ? '전기팀' : '사용자'
        }
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('currentUser', JSON.stringify(userData))
        
        setIsLoggedIn(true)
        setCurrentUser(username)
        
        // 재고관리 페이지로 이동 (URL 파라미터 없이)
        router.push('/stock-management')
      } else {
        setError('사용자명과 비밀번호를 입력해주세요.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 로그아웃 처리
  const handleLogout = (): void => {
    // localStorage에서 사용자 정보 제거
    localStorage.removeItem('currentUser')
    
    setIsLoggedIn(false)
    setCurrentUser('')
    setUsername('')
    setPassword('')
    setError('')
  }

  // 사용자명에 따른 기본 역할 반환
  const getDefaultRole = (username: string): string => {
    if (username.toLowerCase().includes('admin')) return 'admin'
    if (username.toLowerCase().includes('manager')) return 'manager'
    return 'user'
  }

  // 로그인 전 화면
  if (!isLoggedIn) {
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

          {/* 로그인 카드 */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="text-center pb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>로그인</span>
              </h3>
            </div>
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* 사용자명 입력 */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    사용자 ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      placeholder="사용자 ID를 입력하세요"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* 비밀번호 입력 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* 오류 메시지 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* 로그인 버튼 */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
              </form>
            </div>
          </div>

          {/* 재고검색 버튼 */}
          <div className="mt-6 text-center">
            <Button
              onClick={() => router.push('/stock-management')}
              variant="outline"
              size="lg"
              className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300"
            >
              <Package className="h-5 w-5 mr-2" />
              재고검색
            </Button>
          </div>

          {/* 하단 정보 */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              © 2025 JYJ . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 로그인 후 화면
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
          
          {/* 로그인된 사용자 정보 */}
          <div className="mt-4 bg-white rounded-lg shadow-md p-3">
            <p className="text-sm text-gray-700">
              <User className="inline h-4 w-4 mr-2 text-blue-600" />
              <span className="font-semibold">{currentUser}</span>님 환영합니다
            </p>
          </div>
        </div>

        {/* 메뉴 카드 */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center pb-4">
            <h3 className="text-lg font-semibold text-gray-900">업무 메뉴</h3>
          </div>
          
          <div className="space-y-4">
            {/* 재고검색 버튼 */}
            <Button
              onClick={() => router.push('/stock-management')}
              variant="outline"
              size="lg"
              className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300"
            >
              <Package className="h-5 w-5 mr-2" />
              재고검색
            </Button>

            {/* 업무일지 작성 버튼 */}
            <Button
              onClick={() => router.push('/work-diary')}
              variant="outline"
              size="lg"
              className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
            >
              <FileText className="h-5 w-5 mr-2" />
              업무일지 작성
            </Button>

            {/* 업무도구 버튼 */}
            <Button
              onClick={() => router.push('/work-tool')}
              variant="outline"
              size="lg"
              className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              업무도구
            </Button>
          </div>

          {/* 로그아웃 버튼 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2024 유네코레일 전기파트. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
} 