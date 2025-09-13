'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Building2, User, Lock } from 'lucide-react'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, login, isAuthenticated, loading } = useUser()

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.push('/dashboard')
    }
  }, [loading, isAuthenticated, user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')

    try {
      if (username && password) {
        const success = await login(username, password)
        if (!success) {
          setError('사용자명 또는 비밀번호가 올바르지 않습니다.')
        }
      } else {
        setError('사용자명과 비밀번호를 입력해주세요.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSignup = () => {
    router.push('/signup')
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <p className="text-white font-medium">로그인 처리 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">유네코레일</h1>
            <h2 className="text-xl font-semibold text-blue-300 mb-2">전기파트</h2>
            <p className="text-gray-300 text-sm">업무 관리 시스템</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                사용자 ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="사용자 ID를 입력하세요"
                  className="w-full pl-12 h-12 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                비밀번호
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-12 h-12 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>로그인 중...</span>
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">또는</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignup}
            className="w-full h-12 border border-white/20 text-white rounded-xl hover:bg-white/10 hover:border-white/30"
          >
            회원가입
          </button>

        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            © 2024 유네코레일 전기파트. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}