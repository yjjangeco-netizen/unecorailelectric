'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempted, setLoginAttempted] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, loading: authLoading } = useUser()

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLoginAttempted(true)

    try {
      if (!username || !password) {
        setError('사용자명과 비밀번호를 입력해주세요.')
        return
      }

      const success = await login(username, password)
      if (success) {
        router.push('/dashboard')
      } else {
        setError('사용자명 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 로그인 시도 후 창 닫기 방지
  const handleClose = () => {
    if (loginAttempted) {
      return
    }
    setError('로그인을 시도해주세요.')
  }

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
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>로그인</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* 사용자명 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용자 ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="사용자 ID를 입력하세요"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10"
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
          </CardContent>
        </Card>


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