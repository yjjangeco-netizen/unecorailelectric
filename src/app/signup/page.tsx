'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User, Lock, Mail, Briefcase, Users, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    position: '',
    department: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // 직책 옵션
  const positions = ['사원', '대리', '과장', '차장', '부장', '임원']
  
  // 부서 옵션
  const departments = ['전기팀', 'AS', '기계', '구매', '영업']

  // 폼 데이터 업데이트
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 가입 처리
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 모든 필드 검증
      if (!formData.username || !formData.password || !formData.confirmPassword || 
          !formData.name || !formData.position || !formData.department || !formData.email) {
        setError('모든 필드를 입력해주세요.')
        return
      }

      // 비밀번호 확인
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        return
      }

      // 비밀번호 길이 검증
      if (formData.password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.')
        return
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('올바른 이메일 형식을 입력해주세요.')
        return
      }

      // 가입 API 호출
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          level: '1' // 기존 데이터와 일치하도록 '1' 사용
        }),
      })

      if (response.ok) {
        setSuccess('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '회원가입 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 로그인 페이지로 돌아가기
  const handleBackToLogin = () => {
    router.push('/')
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
          <p className="text-gray-600 mt-2">회원가입</p>
        </div>

        {/* 가입 카드 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>회원가입</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {/* 사용자 ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용자 ID *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="사용자 ID를 입력하세요"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="비밀번호를 입력하세요 (6자 이상)"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 직책 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  직책 *
                </label>
                <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="직책을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 부서 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부서 *
                </label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="부서를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 권한 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 text-center">
                  <strong>Level 1 권한:</strong> 재고 조회만 가능합니다.
                </p>
              </div>

              {/* 오류 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 성공 메시지 */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {/* 가입 버튼 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
              >
                {loading ? '가입 중...' : '회원가입'}
              </Button>
            </form>

            {/* 로그인으로 돌아가기 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleBackToLogin}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                로그인으로 돌아가기
              </Button>
            </div>
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
