'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Play,
  Square,
  Settings,
  Bell,
  BellOff,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react'

interface BidItem {
  id: string
  title: string
  source: string
  url: string
  price: string
  deadline: string
  status: string
  createdAt: string
}

interface MonitoringConfig {
  keywords: string[]
  telegramEnabled: boolean
  telegramChatId: string
  checkInterval: number
}

export default function NaraMonitoringPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [bidItems, setBidItems] = useState<BidItem[]>([])
  const [config, setConfig] = useState<MonitoringConfig>({
    keywords: ['전기', '케이블', '변압기'],
    telegramEnabled: false,
    telegramChatId: '',
    checkInterval: 30
  })
  const [showConfig, setShowConfig] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        setLastCheck(new Date())
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
    setShowConfig(false)
    // 설정이 변경되면 모니터링을 재시작할지 묻기
    if (isMonitoring) {
      if (confirm('설정이 변경되었습니다. 모니터링을 재시작하시겠습니까?')) {
        handleStopMonitoring()
        setTimeout(() => handleStartMonitoring(), 1000)
      }
    }
  }

  // 상태 확인
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/status')
      if (response.ok) {
        const data = await response.json()
        setIsMonitoring(data.isMonitoring)
        setBidItems(data.bidItems || [])
        setLastCheck(new Date())
      }
    } catch (err) {
      console.error('상태 확인 실패:', err)
    }
  }

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // 30초마다 상태 확인
    return () => clearInterval(interval)
  }, [])

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

  // 상태별 배지 렌더링
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">진행중</Badge>
      case 'ending':
        return <Badge className="bg-yellow-100 text-yellow-800">마감임박</Badge>
      case 'ended':
        return <Badge className="bg-red-100 text-red-800">마감</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">알수없음</Badge>
    }
  }

  // 출처별 배지 렌더링
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'korail':
        return <Badge className="bg-blue-100 text-blue-800">코레일</Badge>
      case 'naramarket':
        return <Badge className="bg-purple-100 text-purple-800">나라마켓</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">기타</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 에러 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 모니터링 제어 패널 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              모니터링 제어
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
                  onClick={() => setShowConfig(!showConfig)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </Button>
                {isMonitoring ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStopMonitoring}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    중지
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartMonitoring}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    시작
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 설정 패널 */}
        {showConfig && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>모니터링 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 키워드 설정 */}
              <div>
                <Label className="text-sm font-medium">키워드</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {config.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeKeyword(keyword)}
                      >
                        {keyword} ×
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
                <div>
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

              {/* 확인 간격 설정 */}
              <div>
                <Label htmlFor="checkInterval">확인 간격 (초)</Label>
                <Input
                  id="checkInterval"
                  type="number"
                  value={config.checkInterval}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, checkInterval: parseInt(e.target.value) || 30 }))
                  }
                  min="10"
                  max="300"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfig(false)}
                >
                  취소
                </Button>
                <Button onClick={handleSaveConfig}>
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shiftee-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 입찰공고</p>
                  <p className="text-2xl font-bold text-gray-900">{bidItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shiftee-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">진행중</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bidItems.filter(item => item.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shiftee-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">마감임박</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bidItems.filter(item => item.status === 'ending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shiftee-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">마감</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bidItems.filter(item => item.status === 'ended').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 입찰 공고 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              입찰 공고 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bidItems.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">아직 입찰 공고가 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">
                  모니터링을 시작하면 키워드에 맞는 공고를 찾아드립니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bidItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(item.status)}
                          {getSourceBadge(item.source)}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>예산: {item.price}</span>
                          <span>마감: {item.deadline}</span>
                          <span>등록: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}