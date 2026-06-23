'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, ChevronDown, ChevronUp, Copy, Edit, FileText, Link, Plus, Save, Search, Trash2, X } from 'lucide-react'


type ContentType = 'manual' | 'alarm'

interface AdminContentItem {
  id: string
  type: ContentType
  title: string
  category: string
  version: string
  lastUpdated: string
  description: string
  body: string
  active: boolean
  source?: 'admin' | 'board'
  boardId?: number
  boardType?: 'SOP' | 'TOOLS' | 'TROUBLESHOOTING' | 'TECH_DATA'
}

const categories = {
  manual: ['전체', 'SOP', '업무툴', '고장대응', '기술자료'],
  alarm: ['전체', 'sinumerik 840D', 'sinumerik 840Dsl', 'sinumerik one', 'Fanuc']
}

const boardTypeLabels = {
  SOP: 'SOP',
  TOOLS: '업무툴',
  TROUBLESHOOTING: '고장대응',
  TECH_DATA: '기술자료'
} as const

const labelToBoardType = {
  SOP: 'SOP',
  업무툴: 'TOOLS',
  고장대응: 'TROUBLESHOOTING',
  기술자료: 'TECH_DATA'
} as const

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

const emptyDraft = (type: ContentType): AdminContentItem => ({
  id: '',
  type,
  title: '',
  category: type === 'manual' ? '기술자료' : 'sinumerik one',
  version: 'v1.0',
  lastUpdated: today(),
  description: '',
  body: '',
  active: true,
  source: type === 'manual' ? 'board' : 'admin',
  boardType: type === 'manual' ? 'TECH_DATA' : undefined
})

export default function ManualManagementPage() {
  const { user } = useUser()
  const [items, setItems] = useState<AdminContentItem[]>([])
  const [activeType, setActiveType] = useState<ContentType>('manual')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [editingItem, setEditingItem] = useState<AdminContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [googleRequired, setGoogleRequired] = useState(false)
  const [warning, setWarning] = useState('')
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [syncFolder, setSyncFolder] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const userId = user?.id || user?.username || ''
  const requestHeaders = useMemo(() => (userId ? { 'x-user-id': userId } : undefined), [userId])

  const loadItems = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setWarning('')
    setGoogleRequired(false)

    try {
      const response = await fetch('/api/admin-content', {
        headers: requestHeaders,
        cache: 'no-store'
      })
      const data = await response.json()

      if (response.status === 403 && data?.googleRequired) {
        setItems([])
        setGoogleRequired(true)
        setWarning(data?.error || 'Google Drive 인증이 필요합니다.')
        return
      }

      if (!response.ok) {
        throw new Error(data?.error || '매뉴얼/알람 자료를 불러오지 못했습니다.')
      }

      const alarmItems = Array.isArray(data.items)
        ? data.items.map((item: AdminContentItem) => ({ ...item, source: 'admin' as const }))
        : []

      const boardTypes = ['SOP', 'TOOLS', 'TROUBLESHOOTING', 'TECH_DATA'] as const
      const manualLists = await Promise.all(boardTypes.map(async (boardType) => {
        const listResponse = await fetch(`/api/boards?boardType=${boardType}`, { cache: 'no-store' })
        if (!listResponse.ok) return []
        const list = await listResponse.json()
        const details = await Promise.all((Array.isArray(list) ? list : []).map(async (row: any) => {
          const detailResponse = await fetch(`/api/boards/${row.id}`, { cache: 'no-store' })
          if (!detailResponse.ok) return null
          const detail = await detailResponse.json()
          return {
            id: `board-${detail.id}`,
            type: 'manual' as const,
            title: detail.title || '',
            category: boardTypeLabels[boardType],
            version: detail.document_group || '',
            lastUpdated: String(detail.updated_at || detail.created_at || '').slice(0, 10),
            description: detail.drive_web_url ? 'Google Drive에서 가져온 매뉴얼' : '',
            body: detail.content || '',
            active: true,
            source: 'board' as const,
            boardId: detail.id,
            boardType
          }
        }))
        return details.filter(Boolean) as AdminContentItem[]
      }))

      setItems([...alarmItems, ...manualLists.flat()])
      if (data.setupRequired) {
        setWarning('app_settings 테이블이 없습니다. database/create_app_settings.sql 실행이 필요합니다.')
      }
    } catch (error) {
      setItems([])
      setWarning(error instanceof Error ? error.message : '매뉴얼/알람 자료를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [requestHeaders, userId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const connectGoogle = async () => {
    if (!userId) return
    setWarning('')
    try {
      const response = await fetch('/api/assistant/google/connect', { headers: requestHeaders })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Google 연결 준비에 실패했습니다.')
      window.location.href = data.url
    } catch (error) {
      setWarning(error instanceof Error ? error.message : 'Google 연결에 실패했습니다.')
    }
  }

  const handleManualSync = async () => {
    if (!userId || syncing) return
    const folderId = syncFolder.trim()
    if (!folderId) {
      setSyncMsg('드라이브 폴더 링크 또는 ID를 입력하세요.')
      return
    }
    setSyncing(true)
    setSyncMsg('동기화 중입니다... (파일이 많으면 시간이 걸립니다)')
    try {
      const res = await fetch('/api/chatbot-manuals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(requestHeaders || {}) },
        body: JSON.stringify({ folderId })
      })
      const data = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || '동기화에 실패했습니다.')
      setSyncMsg(`✅ ${data.message || '동기화 완료'}`)
    } catch (error) {
      setSyncMsg(`❌ ${error instanceof Error ? error.message : '동기화에 실패했습니다.'}`)
    } finally {
      setSyncing(false)
    }
  }

  const persistItems = async (nextItems: AdminContentItem[]) => {
    setSaving(true)
    setWarning('')
    try {
      const adminItems = nextItems
        .filter((item) => item.source !== 'board')
        .map(({ source, boardId, boardType, ...item }) => item)

      const response = await fetch('/api/admin-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(requestHeaders || {}) },
        body: JSON.stringify({ items: adminItems })
      })
      const data = await response.json()

      if (response.status === 403 && data?.googleRequired) {
        setGoogleRequired(true)
        setWarning(data?.error || 'Google Drive 인증이 필요합니다.')
        return
      }

      if (!response.ok) throw new Error(data?.error || '저장에 실패했습니다.')
      if (data.setupRequired) {
        setWarning('app_settings 테이블이 없습니다. database/create_app_settings.sql 실행이 필요합니다.')
      }
    } catch (error) {
      setWarning(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = activeType === 'manual' ? '매뉴얼' : '알람'
  const visibleItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return items.filter((item) => {
      if (item.type !== activeType) return false
      if (selectedCategory !== '전체' && item.category !== selectedCategory) return false
      if (!query) return true
      return [item.title, item.description, item.body, item.version].join(' ').toLowerCase().includes(query)
    })
  }, [activeType, items, searchTerm, selectedCategory])

  const handleAdd = () => setEditingItem(emptyDraft(activeType))

  const handleCopy = (item: AdminContentItem) => {
    const copied = {
      ...item,
      id: '',
      boardId: undefined,
      title: `${item.title} 복사본`,
      version: item.version.includes('copy') ? item.version : `${item.version}-copy`,
      lastUpdated: today(),
      active: false
    }
    setEditingItem(copied)
  }

  const handleSave = async () => {
    if (!editingItem) return
    if (!editingItem.title.trim()) {
      alert(`${typeLabel} 제목을 입력하세요.`)
      return
    }

    if (editingItem.type === 'manual') {
      setSaving(true)
      setWarning('')
      try {
        const boardType = labelToBoardType[editingItem.category as keyof typeof labelToBoardType] || editingItem.boardType || 'TECH_DATA'
        const isEdit = Boolean(editingItem.boardId)
        const response = await fetch(isEdit ? `/api/boards/${editingItem.boardId}` : '/api/boards', {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
            'x-user-level': String(user?.level || '')
          },
          body: JSON.stringify(isEdit
            ? { title: editingItem.title, content: editingItem.body }
            : {
                boardType,
                title: editingItem.title,
                content: editingItem.body,
                authorName: user?.name || user?.username || '관리자'
              })
        })
        const saved = await response.json()
        if (!response.ok) throw new Error(saved?.error || '매뉴얼 저장에 실패했습니다.')
        await loadItems()
        setEditingItem(null)
      } catch (error) {
        setWarning(error instanceof Error ? error.message : '매뉴얼 저장에 실패했습니다.')
      } finally {
        setSaving(false)
      }
      return
    }

    const itemToSave = {
      ...editingItem,
      id: editingItem.id || `${editingItem.type}-${Date.now()}`,
      lastUpdated: today()
    }
    const exists = items.some((item) => item.id === itemToSave.id)
    const nextItems = exists
      ? items.map((item) => (item.id === itemToSave.id ? itemToSave : item))
      : [itemToSave, ...items]
    setItems(nextItems)
    persistItems(nextItems)
    setEditingItem(null)
  }

  const handleDelete = async (item: AdminContentItem) => {
    if (!confirm('삭제할까요?')) return

    if (item.source === 'board' && item.boardId) {
      setSaving(true)
      setWarning('')
      try {
        const response = await fetch(`/api/boards/${item.boardId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
            'x-user-level': String(user?.level || '')
          }
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error || '매뉴얼 삭제에 실패했습니다.')
        await loadItems()
      } catch (error) {
        setWarning(error instanceof Error ? error.message : '매뉴얼 삭제에 실패했습니다.')
      } finally {
        setSaving(false)
      }
      return
    }

    const nextItems = items.filter((current) => current.id !== item.id)
    setItems(nextItems)
    persistItems(nextItems)
  }

  return (
    <AuthGuard requiredLevel={5}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">매뉴얼/알람 관리</h1>
              <p className="mt-1 text-sm text-gray-600">
                Google Drive 인증을 통과한 뒤 기존 버전을 복사해서 수정합니다.
                {loading ? ' 불러오는 중...' : saving ? ' 저장 중...' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {googleRequired && (
                <Button onClick={connectGoogle} variant="outline">
                  <Link className="mr-2 h-4 w-4" />
                  Google 연결
                </Button>
              )}
              <Button onClick={handleAdd} disabled={googleRequired || loading} className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                {typeLabel} 추가
              </Button>
            </div>
          </div>

          {warning && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warning}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-gray-600">인증 상태를 확인하는 중입니다.</CardContent>
            </Card>
          ) : googleRequired ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-lg font-bold text-gray-900">Google 인증이 필요합니다</h2>
                <p className="mt-2 text-sm text-gray-600">
                  인증 전에는 매뉴얼/알람 목록, 추가, 복사, 수정, 삭제를 사용할 수 없습니다.
                </p>
                <Button onClick={connectGoogle} className="mt-5 bg-blue-600 text-white hover:bg-blue-700">
                  <Link className="mr-2 h-4 w-4" />
                  Google 연결하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">챗봇 매뉴얼 동기화 (구글 드라이브 · 의미검색)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    매뉴얼이 담긴 구글 드라이브 폴더 링크를 붙여넣고 동기화하면, 파일을 읽어 요약·검색어를
                    만들고 의미검색용으로 색인해 QR 챗봇 답변에 연결합니다. 이미지 PDF는 자동 OCR합니다.
                    파일이 많으면 끝날 때까지 여러 번 눌러주세요.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={syncFolder}
                      onChange={(e) => setSyncFolder(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <Button
                      onClick={handleManualSync}
                      disabled={syncing}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {syncing ? '동기화 중...' : '매뉴얼 동기화'}
                    </Button>
                  </div>
                  {syncMsg && <p className="text-sm text-gray-700">{syncMsg}</p>}
                </CardContent>
              </Card>

              <div className="mb-6 flex flex-wrap gap-2">
                <Button
                  variant={activeType === 'manual' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveType('manual')
                    setSelectedCategory('전체')
                    setExpandedItems({})
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  매뉴얼
                </Button>
                <Button
                  variant={activeType === 'alarm' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveType('alarm')
                    setSelectedCategory('전체')
                    setExpandedItems({})
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  알람
                </Button>
              </div>

              <Card className="mb-6">
                <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_220px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`${typeLabel} 검색`}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories[activeType].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {visibleItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-gray-600">등록된 {typeLabel}이 없습니다.</CardContent>
                </Card>
              ) : activeType === 'alarm' ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-semibold">분류</th>
                        <th scope="col" className="px-6 py-3 font-semibold">알람 정보 (원인/조치 아코디언)</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-center">버전</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-center">최종 수정일</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-center">상태</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                      {visibleItems.map((item) => {
                        const isExpanded = !!expandedItems[item.id]
                        return (
                          <tr key={item.id} className="hover:bg-blue-50/5 transition-colors">
                            <td colSpan={6} className="p-0">
                              <div
                                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50"
                                onClick={() => toggleExpand(item.id)}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <span className="inline-flex min-w-[120px] justify-center items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    {item.category}
                                  </span>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[600px]">{item.description}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-8" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs text-gray-600 font-medium min-w-[40px] text-center">{item.version}</span>
                                  <span className="text-xs text-gray-600 min-w-[80px] text-center">{item.lastUpdated}</span>
                                  <span className="min-w-[60px] text-center">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {item.active ? '사용중' : '비활성'}
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-1.5 ml-4">
                                    <Button size="sm" variant="ghost" className="h-8 px-2.5 text-gray-600 hover:text-gray-900" onClick={() => handleCopy(item)}>
                                      <Copy className="h-3.5 w-3.5 mr-1" />
                                      버전복사
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-2.5 text-blue-600 hover:text-blue-700" onClick={() => setEditingItem(item)}>
                                      <Edit className="h-3.5 w-3.5 mr-1" />
                                      수정
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-2.5 text-red-600 hover:text-red-700" onClick={() => handleDelete(item)}>
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      삭제
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="bg-slate-50/50 border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
                                  <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                                    <div>
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">원인</span>
                                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p>
                                    </div>
                                    <div className="pt-2">
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">조치 방법</span>
                                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{item.body}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {visibleItems.map((item) => (
                    <Card key={item.id} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-gray-900">{item.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">{item.category}</span>
                          <span>{item.version}</span>
                          <span>{item.lastUpdated}</span>
                          <span className={item.active ? 'text-green-600' : 'text-gray-400'}>
                            {item.active ? '사용중' : '비활성'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs leading-5 text-gray-700">
                          {item.body}
                        </pre>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleCopy(item)}>
                            <Copy className="mr-1 h-3 w-3" />
                            버전복사
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                            <Edit className="mr-1 h-3 w-3" />
                            수정
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            삭제
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-lg font-bold text-gray-900">{editingItem.id ? `${typeLabel} 수정` : `${typeLabel} 추가`}</h2>
                <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium text-gray-700">
                    제목
                    <input value={editingItem.title} onChange={(event) => setEditingItem({ ...editingItem, title: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm font-medium text-gray-700">
                    버전
                    <input value={editingItem.version} onChange={(event) => setEditingItem({ ...editingItem, version: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  분류
                  <select value={editingItem.category} onChange={(event) => setEditingItem({ ...editingItem, category: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {categories[editingItem.type].filter((category) => category !== '전체').map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  설명
                  <input value={editingItem.description} onChange={(event) => setEditingItem({ ...editingItem, description: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  내용
                  <textarea value={editingItem.body} onChange={(event) => setEditingItem({ ...editingItem, body: event.target.value })} rows={8} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={editingItem.active} onChange={(event) => setEditingItem({ ...editingItem, active: event.target.checked })} />
                  사용중
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t px-5 py-4">
                <Button variant="outline" onClick={() => setEditingItem(null)}>취소</Button>
                <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
