'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User, Lock, Search, FileText, Package, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // GUEST 로그인 처리
      if (username.toUpperCase() === 'GUEST') {
        router.push('/stock-management')
        return
      }

      // 일반 사용자 로그인 처리
      if (username && password) {
        // 여기서 실제 인증 로직을 구현할 수 있습니다
        // 현재는 간단한 예시로 처리
        const userRole = getDefaultRole(username)
        router.push(`/work-tool?role=${userRole}`)
      } else {
        setError('사용자명과 비밀번호를 입력해주세요.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 사용자명에 따른 기본 역할 반환
  const getDefaultRole = (username: string) => {
    if (username.toLowerCase().includes('admin')) return 'admin'
    if (username.toLowerCase().includes('manager')) return 'manager'
    return 'user'
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
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* GUEST 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Search className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    <strong>재고 검색만 이용하실분은 ID에</strong>
                    <br />
                    <span className="font-mono bg-blue-100 px-1 rounded">guest</span>를 입력하세요
                  </p>
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