'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveId, setSaveId] = useState(false)
  const [savePassword, setSavePassword] = useState(false)
  
  const { login, user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()

  // 저장된 ID/비밀번호 불러오기
  useEffect(() => {
    const savedId = localStorage.getItem('savedUsername')
    const savedPassword = localStorage.getItem('savedPassword')
    const saveIdChecked = localStorage.getItem('saveId') === 'true'
    const savePasswordChecked = localStorage.getItem('savePassword') === 'true'
    
    if (savedId && saveIdChecked) {
      setUsername(savedId)
      setSaveId(true)
    }
    if (savedPassword && savePasswordChecked) {
      setPassword(savedPassword)
      setSavePassword(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('로그인 시도:', { username, password })
      const success = await login(username, password)
      console.log('로그인 결과:', success)
      console.log('현재 사용자 상태:', { user, isAuthenticated, authLoading })
      
      if (success) {
        // ID/비밀번호 저장 처리
        if (saveId) {
          localStorage.setItem('savedUsername', username)
          localStorage.setItem('saveId', 'true')
        } else {
          localStorage.removeItem('savedUsername')
          localStorage.removeItem('saveId')
        }
        
        if (savePassword) {
          localStorage.setItem('savedPassword', password)
          localStorage.setItem('savePassword', 'true')
        } else {
          localStorage.removeItem('savedPassword')
          localStorage.removeItem('savePassword')
        }
        
        console.log('대시보드로 이동 시도')
        // 여러 방법으로 이동 시도
        console.log('즉시 대시보드로 이동')
        try {
          router.push('/dashboard')
          router.refresh()
        } catch (e) {
          console.log('router.push 실패, window.location 사용')
          window.location.href = '/dashboard'
        }
      } else {
        console.log('로그인 실패')
        setError('로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.')
      }
    } catch (err) {
      console.error('로그인 오류:', err)
      setError(`로그인 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 섹션 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">유네코레일</h1>
          <p className="text-gray-600">전기파트 업무 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <Card className="shadow-2xl border-0 rounded-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">로그인</CardTitle>
            <p className="text-gray-600">계정에 로그인하여 시작하세요</p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 사용자명 입력 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  사용자명
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="사용자명을 입력하세요"
                  className="h-12 px-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  required
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="h-12 px-4 pr-12 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* 저장 옵션 */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveId"
                    checked={saveId}
                    onCheckedChange={(checked) => setSaveId(checked as boolean)}
                  />
                  <Label htmlFor="saveId" className="text-sm text-gray-700 cursor-pointer">
                    ID 저장
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="savePassword"
                    checked={savePassword}
                    onCheckedChange={(checked) => setSavePassword(checked as boolean)}
                  />
                  <Label htmlFor="savePassword" className="text-sm text-gray-700 cursor-pointer">
                    비밀번호 저장
                  </Label>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    로그인 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    로그인
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                계정이 없으신가요?{' '}
                <Link 
                  href="/signup" 
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                >
                  회원가입하기
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>

        {/* 하단 링크 */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
