'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { Switch } from '@/components/ui/switch'
import { 
  Search, 
  Play, 
  Pause, 
  Settings, 
  Bell, 
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface BidItem {
  id: string
  title: string
  company: string
  price: string
  deadline: string
  status: 'active' | 'closed' | 'upcoming'
  url: string
  source: 'naramarket' | 'korail'
  createdAt: string
}

interface MonitoringConfig {
  enabled: boolean
  keywords: string[]
  checkInterval: number
  telegramEnabled: boolean
  telegramChatId: string
}

export default function NaraMonitoringPage() {
  const [bids, setBids] = useState<BidItem[]>([])
  const [config, setConfig] = useState<MonitoringConfig>({
    enabled: false,
    keywords: ['전기', '전력', '케이블', '변압기'],
    checkInterval: 300,
    telegramEnabled: false,
    telegramChatId: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

  // 모니터링 상태 가져오기
  useEffect(() => {
    fetchMonitoringStatus()
  }, [])

  const fetchMonitoringStatus = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/status')
      if (response.ok) {
        const data = await response.json()
        setBids(data.bids || [])
        setConfig(data.config || config)
      }
    } catch (error) {
      console.error('모니터링 상태 조회 실패:', error)
    }
  }

  const startMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/nara-monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        setConfig(prev => ({ ...prev, enabled: true }))
        await fetchMonitoringStatus()
      }
    } catch (error) {
      console.error('모니터링 시작 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stopMonitoring = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/stop', {
        method: 'POST'
      })
      
      if (response.ok) {
        setConfig(prev => ({ ...prev, enabled: false }))
      }
    } catch (error) {
      console.error('모니터링 중지 실패:', error)
    }
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !config.keywords.includes(newKeyword.trim())) {
      setConfig(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setConfig(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">진행중</Badge>
      case 'closed':
        return <Badge variant="secondary">마감</Badge>
      case 'upcoming':
        return <Badge variant="outline">예정</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSourceBadge = (source: string) => {
    return source === 'naramarket' 
      ? <Badge variant="outline" className="text-blue-600">나라마켓</Badge>
      : <Badge variant="outline" className="text-orange-600">코레일</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nara 입찰 모니터링</h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={config.enabled ? stopMonitoring : startMonitoring}
            disabled={isLoading}
            variant={config.enabled ? "destructive" : "default"}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : config.enabled ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {config.enabled ? '모니터링 중지' : '모니터링 시작'}
          </Button>
          <Button variant="outline" onClick={fetchMonitoringStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 모니터링 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            모니터링 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="monitoring-enabled">모니터링 활성화</Label>
            <input
              type="checkbox"
              id="monitoring-enabled"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <Label htmlFor="keywords">키워드 설정</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="keywords"
                placeholder="새 키워드 입력"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <Button onClick={addKeyword} size="sm">추가</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interval">체크 간격 (초)</Label>
              <Input
                id="interval"
                type="number"
                value={config.checkInterval}
                onChange={(e) => setConfig(prev => ({ ...prev, checkInterval: parseInt(e.target.value) || 300 }))}
              />
            </div>
            <div>
              <Label htmlFor="telegram-chat">텔레그램 채팅 ID</Label>
              <Input
                id="telegram-chat"
                value={config.telegramChatId}
                onChange={(e) => setConfig(prev => ({ ...prev, telegramChatId: e.target.value }))}
                placeholder="채팅 ID 입력"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 입찰 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            입찰 현황 ({bids.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>아직 수집된 입찰 정보가 없습니다.</p>
              <p className="text-sm">모니터링을 시작하면 입찰 정보가 자동으로 수집됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={bid.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{bid.title}</h3>
                        {getStatusBadge(bid.status)}
                        {getSourceBadge(bid.source)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">업체:</span> {bid.company}
                        </div>
                        <div>
                          <span className="font-medium">금액:</span> {bid.price}
                        </div>
                        <div>
                          <span className="font-medium">마감일:</span> {bid.deadline}
                        </div>
                        <div>
                          <span className="font-medium">수집일:</span> {new Date(bid.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={bid.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        상세보기
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
