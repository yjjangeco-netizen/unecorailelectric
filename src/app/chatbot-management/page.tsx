'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Download, FileText, RefreshCw, Search, Settings, Upload } from 'lucide-react'
import AlarmEditor from '@/components/AlarmEditor'

type ChatbotIndexItem = {
  id: string
  type: string
  title: string
  category: string
  version?: string
  lastUpdated?: string
  description?: string
  body?: string
  tags?: string[]
}

type IndexCounts = {
  admin?: number
  manuals?: number
  alarms?: number
}

export default function ChatbotManagementPage() {
  const [items, setItems] = useState<ChatbotIndexItem[]>([])
  const [counts, setCounts] = useState<IndexCounts>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const indexUrl = 'https://unecorailelectric.vercel.app/api/chatbot-content-index'

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/chatbot-alarms/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '업로드 실패')
      setUploadMsg(`✅ 업로드 완료: ${data['입력행']}행 입력${data['건너뜀'] ? `, ${data['건너뜀']}행 건너뜀` : ''}`)
      loadIndex()
    } catch (err) {
      setUploadMsg(`❌ ${err instanceof Error ? err.message : '업로드 실패'}`)
    } finally {
      setUploading(false)
    }
  }

  const loadIndex = async () => {
    setLoading(true)
    setError('')
    setWarnings([])
    try {
      const response = await fetch('/api/chatbot-content-index', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || '챗봇 색인을 불러오지 못했습니다.')
      setItems(Array.isArray(data.items) ? data.items : [])
      setCounts(data.counts || {})
      setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
    } catch (err) {
      setItems([])
      setCounts({})
      setError(err instanceof Error ? err.message : '챗봇 색인을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIndex()
  }, [])

  const stats = useMemo(() => {
    const manual = counts.manuals ?? items.filter((item) => item.type === 'manual').length
    const alarm = counts.alarms ?? items.filter((item) => item.type === 'alarm').length
    return { total: items.length, manual, alarm }
  }, [counts, items])

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return items.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const haystack = [item.title, item.category, item.description, item.body, ...(item.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesType && (!query || haystack.includes(query))
    })
  }, [items, searchTerm, typeFilter])

  return (
    <AuthGuard requiredLevel={5}>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Bot className="h-6 w-6 text-blue-600" />
                챗봇 관리
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                QR_KAKAO 챗봇으로 넘어가는 매뉴얼/알람 색인을 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                onClick={() => { window.location.href = '/api/chatbot-alarms/export' }}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                알람 엑셀 다운로드
              </Button>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? '업로드 중...' : '알람 엑셀 업로드'}
              </Button>
              <Button onClick={loadIndex} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                색인 새로고침
              </Button>
            </div>
          </div>
          {uploadMsg && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {uploadMsg}
            </div>
          )}

          <AlarmEditor />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warnings.join(' / ')}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-700"><Bot className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm text-gray-500">전체 색인</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-green-100 p-3 text-green-700"><FileText className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm text-gray-500">매뉴얼 DB</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.manual}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-purple-100 p-3 text-purple-700"><Settings className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm text-gray-500">알람 DB</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.alarm}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR_KAKAO 연결값</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-gray-500">QR_KAKAO Vercel 환경변수</div>
              <pre className="overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">UNECO_CONTENT_INDEX_URL={indexUrl}</pre>
              <p className="text-gray-500">챗봇 답변이 이상하면 먼저 여기 색인에 자료가 잡히는지 확인하면 됩니다.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="챗봇 색인 검색"
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="manual">매뉴얼</option>
                <option value="alarm">알람</option>
              </select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {loading ? (
              <Card className="lg:col-span-2">
                <CardContent className="p-8 text-center text-sm text-gray-600">색인을 불러오는 중입니다.</CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card className="lg:col-span-2">
                <CardContent className="p-8 text-center text-sm text-gray-600">표시할 챗봇 색인이 없습니다.</CardContent>
              </Card>
            ) : filteredItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-900">{item.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">{item.type}</span>
                    {item.category && <span>{item.category}</span>}
                    {item.version && <span>{item.version}</span>}
                    {item.lastUpdated && <span>{item.lastUpdated}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  {item.description && <p className="mb-2 text-sm text-gray-600">{item.description}</p>}
                  <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs leading-5 text-gray-700">
                    {item.body || '내용 없음'}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
