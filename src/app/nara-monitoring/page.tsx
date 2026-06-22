'use client'

import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Play,
  RefreshCw,
  Settings,
  Square
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
  telegramBotToken: string
  telegramChatId: string
  naraMarketApiKey: string
  checkInterval: number
}

const CONFIG_STORAGE_KEY = 'nara-monitoring-config'
const BID_ITEMS_STORAGE_KEY = 'nara-monitoring-bids'
const DEFAULT_CONFIG: MonitoringConfig = {
  keywords: ['전기', '전력', '케이블', '변압기'],
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  naraMarketApiKey: '',
  checkInterval: 30
}

function normalizeConfig(value: Partial<MonitoringConfig> | null | undefined): MonitoringConfig {
  const keywords = Array.isArray(value?.keywords)
    ? value.keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
    : DEFAULT_CONFIG.keywords

  return {
    keywords: keywords.length > 0 ? keywords : DEFAULT_CONFIG.keywords,
    telegramEnabled: Boolean(value?.telegramEnabled),
    telegramBotToken: String(value?.telegramBotToken || ''),
    telegramChatId: String(value?.telegramChatId || ''),
    naraMarketApiKey: String(value?.naraMarketApiKey || ''),
    checkInterval: Math.min(300, Math.max(10, Number(value?.checkInterval) || DEFAULT_CONFIG.checkInterval))
  }
}

export default function NaraMonitoringPage() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [bidItems, setBidItems] = useState<BidItem[]>([])
  const [config, setConfig] = useState<MonitoringConfig>(DEFAULT_CONFIG)
  const [newKeyword, setNewKeyword] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ending' | 'ended'>('all')
  const showConfigRef = useRef(false)
  // config 덮어쓰기 방지: 마지막으로 사용자가 설정한 config를 ref로 유지
  const userConfigRef = useRef<MonitoringConfig | null>(null)

  useEffect(() => {
    showConfigRef.current = showConfig
  }, [showConfig])

  const readLocalConfig = (): MonitoringConfig | null => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
      return stored ? normalizeConfig(JSON.parse(stored)) : null
    } catch {
      return null
    }
  }

  const writeLocalConfig = (nextConfig: MonitoringConfig) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(nextConfig))
  }

  const writeLocalBidItems = (items: BidItem[]) => {
    localStorage.setItem(BID_ITEMS_STORAGE_KEY, JSON.stringify(items))
  }

  const readLocalBidItems = (): BidItem[] => {
    try {
      const stored = localStorage.getItem(BID_ITEMS_STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/config')
      const data = response.ok ? await response.json() : null
      const localConfig = readLocalConfig()
      const serverConfig = normalizeConfig(data?.config || DEFAULT_CONFIG)
      const nextConfig = data?.setupRequired && localConfig
        ? localConfig
        : normalizeConfig({
            ...serverConfig,
            telegramEnabled: localConfig?.telegramEnabled ?? serverConfig.telegramEnabled,
            telegramBotToken: localConfig?.telegramBotToken || serverConfig.telegramBotToken,
            telegramChatId: localConfig?.telegramChatId || serverConfig.telegramChatId,
            naraMarketApiKey: localConfig?.naraMarketApiKey || serverConfig.naraMarketApiKey
          })

      setConfig(nextConfig)
      // 최초 로드 시 userConfigRef 초기화
      userConfigRef.current = nextConfig
    } catch (err) {
      const localConfig = readLocalConfig()
      if (localConfig) {
        setConfig(localConfig)
        userConfigRef.current = localConfig
      }
      console.error('NARA 설정 조회 실패:', err)
    }
  }

  const handleStartMonitoring = async (overrideConfig?: MonitoringConfig) => {
    const activeConfig = overrideConfig || config

    try {
      const response = await fetch('/api/nara-monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeConfig)
      })

      if (response.ok) {
        const data = await response.json()
        setIsMonitoring(true)
        const items = data.bidItems || []
        setBidItems(items)
        writeLocalBidItems(items)
        setError(data.status?.errors?.length ? data.status.errors.join('\n') : null)
        setLastCheck(new Date())
      } else {
        const errorData = await response.json()
        setError(errorData.message || '모니터링 시작에 실패했습니다.')
      }
    } catch {
      setError('서버와 통신에 실패했습니다.')
    }
  }

  const handleStopMonitoring = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/stop', { method: 'POST' })

      if (response.ok) {
        setIsMonitoring(false)
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '모니터링 중지에 실패했습니다.')
      }
    } catch {
      setError('서버와 통신에 실패했습니다.')
    }
  }

  const handleSaveConfig = async () => {
    const nextConfig = normalizeConfig(config)
    writeLocalConfig(nextConfig)
    userConfigRef.current = nextConfig

    try {
      const response = await fetch('/api/nara-monitoring/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig)
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || '설정 저장에 실패했습니다.')
      }

      // 서버에서 돌아온 config가 아닌, 사용자가 입력한 nextConfig를 유지
      writeLocalConfig(nextConfig)
      setShowConfig(false)
      setError(null)

      // 키워드 변경을 즉시 반영하기 위해 항상 재시작
      await handleStartMonitoring(nextConfig)
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 저장에 실패했습니다.')
    }
  }

  /** 현재 UI 키워드로 즉시 한 번 검색합니다. */
  const handleSearchNow = async () => {
    setIsSearching(true)
    setError(null)
    userConfigRef.current = config
    try {
      const response = await fetch('/api/nara-monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (response.ok) {
        const data = await response.json()
        setIsMonitoring(true)
        const items = data.bidItems || []
        setBidItems(items)
        writeLocalBidItems(items)
        setLastCheck(new Date())
        setError(data.status?.errors?.length ? data.status.errors.join('\n') : null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '검색에 실패했습니다.')
      }
    } catch {
      setError('서버와 통신에 실패했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/nara-monitoring/status')
      if (!response.ok) return

      const data = await response.json()
      setIsMonitoring(data.isMonitoring)
      const items = data.bidItems || []
      if (items.length > 0) {
        setBidItems(items)
        writeLocalBidItems(items)
      } else {
        setBidItems((current) => current.length > 0 ? current : readLocalBidItems())
      }
      setError(data.errors?.length ? data.errors.join('\n') : null)
      setLastCheck(new Date())

      // ⚠️ config(키워드)는 절대 서버에서 덮어쓰지 않음.
      // 사용자가 UI에서 수정한 키워드를 유지하기 위해 config setConfig 제거.
    } catch (err) {
      console.error('상태 확인 실패:', err)
    }
  }

  useEffect(() => {
    setBidItems(readLocalBidItems())
    loadConfig().then(checkStatus)
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const addKeyword = () => {
    const keyword = newKeyword.trim()
    if (!keyword) return

    setConfig((prev) => {
      if (prev.keywords.includes(keyword)) return prev
      return { ...prev, keywords: [...prev.keywords, keyword] }
    })
    setNewKeyword('')
  }

  const removeKeyword = (keyword: string) => {
    setConfig((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((item) => item !== keyword)
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">진행중</Badge>
      case 'ending':
        return <Badge className="bg-yellow-100 text-yellow-800">마감임박</Badge>
      case 'ended':
        return <Badge className="bg-red-100 text-red-800">마감</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">알 수 없음</Badge>
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'korail':
        return <Badge className="bg-blue-100 text-blue-800">코레일</Badge>
      case 'naramarket':
        return <Badge className="bg-purple-100 text-purple-800">나라장터</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">기타</Badge>
    }
  }

  const filteredBidItems = statusFilter === 'all'
    ? bidItems
    : bidItems.filter((item) => item.status === statusFilter)

  const toggleStatusFilter = (nextFilter: 'all' | 'active' | 'ending' | 'ended') => {
    setStatusFilter((current) => current === nextFilter ? 'all' : nextFilter)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              모니터링 제어
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium">{isMonitoring ? '모니터링 중' : '중지됨'}</span>
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
                  onClick={() => setShowConfig((current) => !current)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchNow}
                  disabled={isSearching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
                  {isSearching ? '검색 중...' : '지금 검색'}
                </Button>
                {isMonitoring ? (
                  <Button variant="destructive" size="sm" onClick={handleStopMonitoring}>
                    <Square className="h-4 w-4 mr-2" />
                    중지
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleStartMonitoring()}>
                    <Play className="h-4 w-4 mr-2" />
                    시작
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {showConfig && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                모니터링 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">키워드 설정</Label>
                <p className="text-sm text-gray-500 mb-3">입찰 공고에서 검색할 키워드를 설정하세요.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {config.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword} <span className="ml-1">x</span>
                    </Badge>
                  ))}
                </div>
                <div className="flex max-w-md gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(event) => setNewKeyword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') addKeyword()
                    }}
                    placeholder="키워드를 입력하세요"
                  />
                  <Button variant="outline" onClick={addKeyword}>
                    추가
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">텔레그램 알림</Label>
                    <p className="text-sm text-gray-500">새 입찰 공고를 텔레그램으로 알림받기</p>
                  </div>
                  <Switch
                    checked={config.telegramEnabled}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, telegramEnabled: checked }))
                    }
                  />
                </div>

                {config.telegramEnabled && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="telegramBotToken">텔레그램 봇 토큰</Label>
                      <Input
                        id="telegramBotToken"
                        type="password"
                        value={config.telegramBotToken}
                        onChange={(event) => {
                          const telegramBotToken = event.target.value
                          setConfig((prev) => {
                            const nextConfig = { ...prev, telegramBotToken }
                            writeLocalConfig(nextConfig)
                            return nextConfig
                          })
                        }}
                        placeholder="봇 토큰을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                    <div>
                    <Label htmlFor="telegramChatId">텔레그램 채팅 ID</Label>
                    <Input
                      id="telegramChatId"
                      value={config.telegramChatId}
                      onChange={(event) => {
                        const telegramChatId = event.target.value
                        setConfig((prev) => {
                          const nextConfig = { ...prev, telegramChatId }
                          writeLocalConfig(nextConfig)
                          return nextConfig
                        })
                      }}
                      placeholder="채팅 ID를 입력하세요"
                      className="mt-1"
                    />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="naraMarketApiKey">나라장터 API 키</Label>
                <p className="text-sm text-gray-500 mb-2">공공데이터포털 조달청 입찰공고정보서비스 키를 입력하세요.</p>
                <Input
                  id="naraMarketApiKey"
                  type="password"
                  value={config.naraMarketApiKey}
                  onChange={(event) => {
                    const naraMarketApiKey = event.target.value
                    setConfig((prev) => {
                      const nextConfig = { ...prev, naraMarketApiKey }
                      writeLocalConfig(nextConfig)
                      return nextConfig
                    })
                  }}
                  placeholder="공공데이터포털 서비스키"
                  className="mt-1"
                />
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="checkInterval">확인 간격 (초)</Label>
                <p className="text-sm text-gray-500 mb-2">입찰 공고를 확인하는 간격을 설정하세요. (10초 ~ 300초)</p>
                <Input
                  id="checkInterval"
                  type="number"
                  value={config.checkInterval}
                  onChange={(event) =>
                    setConfig((prev) => ({ ...prev, checkInterval: Number(event.target.value) || 30 }))
                  }
                  min="10"
                  max="300"
                  className="w-32"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">키워드</h4>
                  <p className="text-sm text-blue-700">{config.keywords.length}개 설정됨</p>
                  <p className="text-xs text-blue-600 mt-1">{config.keywords.join(', ')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">텔레그램 알림</h4>
                  <p className="text-sm text-green-700">
                    {config.telegramEnabled ? '활성화됨' : '비활성화됨'}
                  </p>
                  {config.telegramEnabled && config.telegramChatId && (
                    <p className="text-xs text-green-600 mt-1">채팅 ID: {config.telegramChatId}</p>
                  )}
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">확인 간격</h4>
                  <p className="text-sm text-purple-700">{config.checkInterval}초마다 확인</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {config.checkInterval < 60
                      ? `${config.checkInterval}초`
                      : `${Math.floor(config.checkInterval / 60)}분 ${config.checkInterval % 60}초`}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowConfig(false)}>
                  취소
                </Button>
                <Button onClick={handleSaveConfig}>저장</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card
            className={`shiftee-card cursor-pointer transition-colors ${statusFilter === 'all' ? 'ring-2 ring-blue-300' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
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

          <Card
            className={`shiftee-card cursor-pointer transition-colors ${statusFilter === 'active' ? 'ring-2 ring-green-300' : ''}`}
            onClick={() => toggleStatusFilter('active')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">진행중</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bidItems.filter((item) => item.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`shiftee-card cursor-pointer transition-colors ${statusFilter === 'ending' ? 'ring-2 ring-yellow-300' : ''}`}
            onClick={() => toggleStatusFilter('ending')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">마감임박</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bidItems.filter((item) => item.status === 'ending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`shiftee-card cursor-pointer transition-colors ${statusFilter === 'ended' ? 'ring-2 ring-orange-300' : ''}`}
            onClick={() => toggleStatusFilter('ended')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">마감</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bidItems.filter((item) => item.status === 'ended').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              입찰 공고 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBidItems.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">아직 입찰 공고가 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">
                  모니터링을 시작하면 키워드에 맞는 공고를 찾아드립니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBidItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(item.status)}
                          {getSourceBadge(item.source)}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>예산: {item.price}</span>
                          <span>마감: {item.deadline}</span>
                          <span>등록: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(item.url, '_blank')}>
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
