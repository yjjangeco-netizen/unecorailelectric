'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Play, 
  Square, 
  Settings, 
  Bell, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Building2
} from 'lucide-react'

interface BidItem {
  id: string
  title: string
  company: string
  price: string
  deadline: string
  status: 'active' | 'closed' | 'upcoming'
  source: 'naramarket' | 'korail'
}

interface MonitoringConfig {
  keywords: string[]
  telegramEnabled: boolean
  telegramChatId: string
  checkInterval: number
}

export default function NaraMonitoringPage() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [bidItems, setBidItems] = useState<BidItem[]>([])
  const [config, setConfig] = useState<MonitoringConfig>({
    keywords: ['전기', '케이블', '변압기'],
    telegramEnabled: false,
    telegramChatId: '',
    checkInterval: 30
  })
  const [newKeyword, setNewKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 샘플 데이터
  const sampleBidItems: BidItem[] = [
    {
      id: '1',
      title: '전기 케이블 공급 및 설치',
      company: '한국철도공사',
      price: '2,500만원',
      deadline: '2024-01-15',
      status: 'active',
      source: 'korail'
    },
    {
      id: '2',
      title: '변압기 교체 공사',
      company: '서울시청',
      price: '1,800만원',
      deadline: '2024-01-20',
      status: 'active',
      source: 'naramarket'
    },
    {
      id: '3',
      title: '전력설비 정비',
      company: '부산시청',
      price: '3,200만원',
      deadline: '2024-01-10',
      status: 'closed',
      source: 'korail'
    }
  ]

  useEffect(() => {
    setBidItems(sampleBidItems)
  }, [])

  const handleStartMonitoring = async () => {
    setIsLoading(true)
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
      }
    } catch (error) {
      console.error('모니터링 시작 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/nara-monitoring/stop', {
        method: 'POST',
      })
      
      if (response.ok) {
        setIsMonitoring(false)
      }
    } catch (error) {
      console.error('모니터링 중지 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !config.keywords.includes(newKeyword.trim())) {
      setConfig({
        ...config,
        keywords: [...config.keywords, newKeyword.trim()]
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setConfig({
      ...config,
      keywords: config.keywords.filter(k => k !== keyword)
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">진행중</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">마감</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">예정</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">알 수 없음</Badge>
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="shiftee-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="shiftee-heading-3">Nara 입찰 모니터링</h1>
                <p className="shiftee-text">실시간 입찰공고 모니터링 및 알림 서비스</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isMonitoring ? '모니터링 중' : '중지됨'}
                </span>
              </div>
              {isMonitoring ? (
                <Button 
                  onClick={handleStopMonitoring}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="h-4 w-4 mr-2" />
                  중지
                </Button>
              ) : (
                <Button 
                  onClick={handleStartMonitoring}
                  disabled={isLoading}
                  className="shiftee-button"
                >
                  <Play className="h-4 w-4 mr-2" />
                  시작
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shiftee-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 설정 패널 */}
          <div className="lg:col-span-1">
            <Card className="shiftee-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  모니터링 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 키워드 설정 */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">검색 키워드</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="키워드 입력"
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <Button onClick={addKeyword} size="sm">
                        추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {config.keywords.map((keyword, index) => (
                        <Badge 
                          key={index} 
                          className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 텔레그램 설정 */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">텔레그램 알림</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.telegramEnabled}
                        onChange={(e) => setConfig({...config, telegramEnabled: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">텔레그램 알림 활성화</span>
                    </div>
                    {config.telegramEnabled && (
                      <Input
                        value={config.telegramChatId}
                        onChange={(e) => setConfig({...config, telegramChatId: e.target.value})}
                        placeholder="채팅 ID 입력"
                      />
                    )}
                  </div>
                </div>

                {/* 체크 간격 */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">체크 간격 (분)</Label>
                  <Input
                    type="number"
                    value={config.checkInterval}
                    onChange={(e) => setConfig({...config, checkInterval: parseInt(e.target.value) || 30})}
                    min="1"
                    max="1440"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 입찰 목록 */}
          <div className="lg:col-span-2">
            <Card className="shiftee-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    입찰공고 목록
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {bidItems.length}건
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bidItems.map((item) => (
                    <div 
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {item.company}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {item.deadline}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(item.status)}
                            {getSourceBadge(item.source)}
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {item.price}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            상세보기
                          </Button>
                          <Button size="sm" className="shiftee-button">
                            지원하기
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shiftee-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 입찰</p>
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
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">오늘 발견</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shiftee-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">알림 발송</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
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
                  <p className="text-sm font-medium text-gray-600">마감 임박</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}