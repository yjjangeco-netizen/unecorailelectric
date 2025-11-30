'use client'
// Login Page Component

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, Eye, EyeOff, ArrowRight, User, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')
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

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    setError('')
    setIsLoading(true)
    setStatus('loading')

    try {
      const success = await login(username, password)
      
      if (success) {
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

        // Context가 업데이트되었으므로 바로 이동
        console.log('로그인 성공, 대시보드로 이동')
        setStatus('success')
        // router.push 대신 window.location.href 사용 (확실한 이동 보장)
        window.location.href = '/dashboard'
      } else {
        console.log('Login returned false')
        setStatus('error')
        setError('로그인 실패: 사용자명 또는 비밀번호를 확인해주세요.')
      }
    } catch (err) {
      console.error('Login error', err)
      setStatus('error')
      setError(`로그인 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-50 rounded-full opacity-50 blur-xl"></div>

        <div className="text-center relative">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">유네코레일</h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">전기팀 자재관리 시스템</p>
        </div>

        <div className="space-y-6 relative">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-shake">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            <div className="group">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="아이디를 입력하세요"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
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
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <input
                id="save-id"
                name="save-id"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors cursor-pointer"
                checked={saveId}
                onChange={(e) => setSaveId(e.target.checked)}
              />
              <label htmlFor="save-id" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none hover:text-gray-900">
                아이디 저장
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="save-password"
                name="save-password"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors cursor-pointer"
                checked={savePassword}
                onChange={(e) => setSavePassword(e.target.checked)}
              />
              <label htmlFor="save-password" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none hover:text-gray-900">
                비밀번호 저장
              </label>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                로그인 중...
              </>
            ) : status === 'success' ? (
              'SUCCESS - REDIRECTING...'
            ) : status === 'error' ? (
              'FAILED - RETRY'
            ) : (
              '로그인'
            )}
          </Button>
          
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
        </div>
      </div>
    </div>
  )
}
