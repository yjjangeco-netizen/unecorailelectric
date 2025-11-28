'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import CommonHeader from '@/components/CommonHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Bell,
  BellOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Save,
  X
} from 'lucide-react'

interface MonitoringConfig {
  keywords: string[]
  telegramEnabled: boolean
  telegramChatId: string
  checkInterval: number
}

export default function NaraSettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [config, setConfig] = useState<MonitoringConfig>({
    keywords: ['전기', '케이블', '변압기'],
    telegramEnabled: false,
    telegramChatId: '',
    checkInterval: 30
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 상태 확인 함수
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/status')
      if (response.ok) {
        const data = await response.json()
        setIsMonitoring(data.isMonitoring)
        setLastCheck(new Date())
      }
    } catch (err) {
      console.error('상태 확인 실패:', err)
    }
  }

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    checkStatus()
  }, [])

  // 인증 확인
  useEffect(() => {
    console.log('Nara 설정 - 사용자 상태:', { user, isAuthenticated, authLoading })

    // localStorage에서 직접 사용자 정보 확인
    const storedUser = localStorage.getItem('user')
    console.log('Nara 설정 - localStorage 직접 확인:', storedUser)

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        console.log('Nara 설정 - localStorage 사용자 데이터:', userData)
        // localStorage에 사용자 정보가 있으면 페이지 표시
        if (userData && userData.id && userData.username) {
          console.log('Nara 설정 - localStorage 기반 인증 확인, 페이지 표시')
          return
        }
      } catch (err) {
        console.error('localStorage 파싱 오류:', err)
      }
    }

    // 로딩이 완료되고 인증되지 않은 경우에만 리다이렉트
    if (!authLoading && !isAuthenticated && !storedUser) {
      console.log('Nara 설정 - 로그인 페이지로 리다이렉트')
      router.push('/login')
    } else if (isAuthenticated) {
      console.log('Nara 설정 - 인증된 사용자, 페이지 표시')
    }
  }, [authLoading, isAuthenticated, router, user])

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

  // 모니터링 시작/중지
  const handleStartMonitoring = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setIsMonitoring(true)
        setError(null)
        setSuccess('모니터링이 시작되었습니다.')
        setLastCheck(new Date())
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '모니터링 시작에 실패했습니다.')
      }
    } catch (err) {
      setError('서버와의 통신에 실패했습니다.')
    }
  }

  const handleStopMonitoring = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/stop', {
        method: 'POST',
      })

      if (response.ok) {
        setIsMonitoring(false)
        setError(null)
        setSuccess('모니터링이 중지되었습니다.')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '모니터링 중지에 실패했습니다.')
      }
    } catch (err) {
      setError('서버와의 통신에 실패했습니다.')
    }
  }

  // 설정 저장
  const handleSaveConfig = () => {
    setSuccess('설정이 저장되었습니다.')
    setTimeout(() => setSuccess(null), 3000)

    // 설정이 변경되면 모니터링을 재시작할지 묻기
    if (isMonitoring) {
      if (confirm('설정이 변경되었습니다. 모니터링을 재시작하시겠습니까?')) {
        handleStopMonitoring()
        setTimeout(() => handleStartMonitoring(), 1000)
      }
    }
  }


  // 키워드 추가/제거
  const addKeyword = () => {
    const newKeyword = prompt('새 키워드를 입력하세요:')
    if (newKeyword && !config.keywords.includes(newKeyword)) {
      setConfig(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword]
      }))
    }
  }

  const removeKeyword = (keyword: string) => {
    setConfig(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <CommonHeader
        currentUser={user}
        isAdmin={user?.level === 'admin'}
        title="입찰모니터링 설정"
        backUrl="/settings"
        onLogout={() => router.push('/login')}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러/성공 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* 모니터링 상태 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              모니터링 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium">
                    {isMonitoring ? '모니터링 중' : '중지됨'}
                  </span>
                </div>
                {lastCheck && (
                  <span className="text-sm text-gray-500">
                    마지막 확인: {lastCheck.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkStatus}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  상태 확인
                </Button>
                {isMonitoring ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStopMonitoring}
                  >
                    <BellOff className="h-4 w-4 mr-2" />
                    중지
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartMonitoring}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    시작
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 모니터링 설정 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              모니터링 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 키워드 설정 */}
            <div>
              <Label className="text-sm font-medium">키워드 설정</Label>
              <p className="text-sm text-gray-500 mb-3">입찰 공고에서 검색할 키워드를 설정하세요.</p>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {config.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addKeyword}
                >
                  키워드 추가
                </Button>
              </div>
            </div>

            {/* 텔레그램 설정 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">텔레그램 알림</Label>
                  <p className="text-sm text-gray-500">새 입찰 공고를 텔레그램으로 알림받기</p>
                </div>
                <Switch
                  checked={config.telegramEnabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, telegramEnabled: checked }))
                  }
                />
              </div>

              {config.telegramEnabled && (
                <div className="mt-4">
                  <Label htmlFor="telegramChatId">텔레그램 채팅 ID</Label>
                  <Input
                    id="telegramChatId"
                    value={config.telegramChatId}
                    onChange={(e) =>
                      setConfig(prev => ({ ...prev, telegramChatId: e.target.value }))
                    }
                    placeholder="채팅 ID를 입력하세요"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* 확인 간격 설정 */}
            <div className="border-t pt-4">
              <Label htmlFor="checkInterval">확인 간격 (초)</Label>
              <p className="text-sm text-gray-500 mb-2">입찰 공고를 확인하는 간격을 설정하세요. (10초 ~ 300초)</p>
              <Input
                id="checkInterval"
                type="number"
                value={config.checkInterval}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, checkInterval: parseInt(e.target.value) || 30 }))
                }
                min="10"
                max="300"
                className="w-32"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                취소
              </Button>
              <Button onClick={handleSaveConfig}>
                <Save className="h-4 w-4 mr-2" />
                설정 저장
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 설정 정보 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              현재 설정 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">키워드</h4>
                <p className="text-sm text-blue-700">
                  {config.keywords.length}개 설정됨
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {config.keywords.join(', ')}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">텔레그램 알림</h4>
                <p className="text-sm text-green-700">
                  {config.telegramEnabled ? '활성화됨' : '비활성화됨'}
                </p>
                {config.telegramEnabled && config.telegramChatId && (
                  <p className="text-xs text-green-600 mt-1">
                    채팅 ID: {config.telegramChatId}
                  </p>
                )}
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">확인 간격</h4>
                <p className="text-sm text-purple-700">
                  {config.checkInterval}초마다 확인
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {config.checkInterval < 60 ? `${config.checkInterval}초` : `${Math.floor(config.checkInterval / 60)}분 ${config.checkInterval % 60}초`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
