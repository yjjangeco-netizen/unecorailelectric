'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
// import { Checkbox } from '@/components/ui/checkbox'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  Shield,
  User
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ValidationRule {
  test: (value: string) => boolean
  message: string
}

export default function AdvancedLoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [validation, setValidation] = useState({
    username: { isValid: false, message: '' },
    password: { isValid: false, message: '' }
  })
  
  const { login } = useUser()
  const router = useRouter()

  // 유효성 검사 규칙
  const validationRules: Record<string, ValidationRule[]> = {
    username: [
      {
        test: (value) => value.length >= 3,
        message: '사용자명은 최소 3자 이상이어야 합니다.'
      },
      {
        test: (value) => /^[a-zA-Z0-9@._-]+$/.test(value),
        message: '사용자명은 영문, 숫자, @, ., _, - 만 사용 가능합니다.'
      }
    ],
    password: [
      {
        test: (value) => value.length >= 6,
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      },
      {
        test: (value) => /^(?=.*[a-zA-Z])(?=.*\d)/.test(value),
        message: '비밀번호는 영문과 숫자를 포함해야 합니다.'
      }
    ]
  }

  // 실시간 유효성 검사
  const validateField = (name: string, value: string) => {
    const rules = validationRules[name] || []
    const failedRule = rules.find(rule => !rule.test(value))
    
    setValidation(prev => ({
      ...prev,
      [name]: {
        isValid: !failedRule,
        message: failedRule ? failedRule.message : ''
      }
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 실시간 유효성 검사
    validateField(name, value)
    
    // 입력 시 에러 메시지 초기화
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 최종 유효성 검사
    const isFormValid = Object.values(validation).every(field => field.isValid)
    if (!isFormValid) {
      setError('입력 정보를 확인해주세요.')
      setIsLoading(false)
      return
    }

    try {
      await login(formData.username, formData.password)
      
      // 로그인 성공 시 rememberMe 처리
      if (rememberMe) {
        localStorage.setItem('rememberedUser', formData.username)
      } else {
        localStorage.removeItem('rememberedUser')
      }
      
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 저장된 사용자명 로드
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser')
    if (rememberedUser) {
      setFormData(prev => ({ ...prev, username: rememberedUser }))
      setRememberMe(true)
      validateField('username', rememberedUser)
    }
  }, [])

  const isFormValid = validation.username.isValid && validation.password.isValid

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">안전한 로그인</h1>
          <p className="text-gray-300 text-lg">보안이 강화된 계정으로 로그인하세요</p>
        </div>

        {/* 로그인 카드 */}
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-white">로그인</CardTitle>
            <CardDescription className="text-center text-gray-300">
              계정 정보를 안전하게 입력해주세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 사용자명 입력 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-white">
                  사용자명 또는 이메일
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="사용자명 또는 이메일을 입력하세요"
                    className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    required
                    disabled={isLoading}
                  />
                  {formData.username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validation.username.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {formData.username && !validation.username.isValid && (
                  <p className="text-xs text-red-400">{validation.username.message}</p>
                )}
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && !validation.password.isValid && (
                  <p className="text-xs text-red-400">{validation.password.message}</p>
                )}
              </div>

              {/* 로그인 상태 유지 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                />
                <Label htmlFor="remember" className="text-sm text-gray-300">
                  로그인 상태 유지
                </Label>
              </div>

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    보안 로그인
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* 추가 옵션 */}
            <div className="space-y-4">
              {/* 비밀번호 찾기 */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors"
                  disabled={isLoading}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-gray-400">또는</span>
                </div>
              </div>

              {/* 회원가입 링크 */}
              <div className="text-center">
                <span className="text-sm text-gray-300">계정이 없으신가요? </span>
                <button
                  type="button"
                  className="text-sm text-purple-300 hover:text-purple-200 hover:underline font-medium transition-colors"
                  disabled={isLoading}
                >
                  회원가입
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
