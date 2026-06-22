'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, FileText, Folder, RefreshCw, Search, Sparkles } from 'lucide-react'

type DriveNode = {
  id: string
  name: string
  type: 'folder' | 'file'
  mimeType?: string
  webViewLink?: string
  previewUrl?: string | null
  modifiedTime?: string
  size?: string
  children?: DriveNode[]
}

function flattenNodes(nodes: DriveNode[], parentPath = 'manual'): Array<DriveNode & { path: string }> {
  return nodes.flatMap((node) => {
    const path = `${parentPath}/${node.name}`
    const current = { ...node, path }
    return node.children?.length ? [current, ...flattenNodes(node.children, path)] : [current]
  })
}

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleString('ko-KR')
}

function getFileKind(node: DriveNode) {
  if (node.type === 'folder') return '폴더'
  if (node.mimeType?.includes('pdf')) return 'PDF'
  if (node.mimeType?.includes('document')) return 'Google Docs'
  if (node.mimeType?.includes('spreadsheet')) return 'Google Sheets'
  if (node.mimeType?.includes('presentation')) return 'Google Slides'
  if (node.mimeType?.includes('image')) return '이미지'
  return '파일'
}

export default function WorkToolDriveLibraryPage() {
  const { user } = useUser()
  const [root, setRoot] = useState<DriveNode | null>(null)
  const [selected, setSelected] = useState<DriveNode | null>(null)
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('전체')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadLibrary = async () => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/work-tool/drive-library', {
        headers: { 'x-user-id': user.id }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Drive 문서를 불러오지 못했습니다.')
      setRoot(data.root)
      const firstFile = flattenNodes(data.root.children || []).find((item) => item.type === 'file')
      setSelected(firstFile || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Drive 문서를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLibrary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const items = useMemo(() => flattenNodes(root?.children || []), [root])
  const files = items.filter((item) => item.type === 'file')
  const folders = items.filter((item) => item.type === 'folder')
  const groups = ['전체', 'main-original', 'SOP', 'Worktool', 'Breakdown', 'engineerData', 'copied']

  const filtered = items.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || item.name.toLowerCase().includes(term) || item.path.toLowerCase().includes(term)
    const matchesGroup = group === '전체' || item.path.includes(`/manual/${group}`) || item.path.includes(`/${group}/`)
    return matchesSearch && matchesGroup
  })

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-[1800px] space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-700">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold">Google Drive Manual Library</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Drive 문서 라이브러리</h1>
              <p className="mt-1 text-sm text-gray-600">Unecorail/manual 아래 문서를 사이트에서 바로 검색하고 미리봅니다.</p>
            </div>
            <Button onClick={loadLibrary} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500">전체 항목</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{items.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500">파일</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{files.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500">폴더</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{folders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500">선택</div>
                <div className="mt-1 truncate text-lg font-semibold text-gray-900">{selected?.name || '-'}</div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <Card className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="파일명 또는 경로 검색"
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {groups.map((item) => (
                    <button
                      key={item}
                      onClick={() => setGroup(item)}
                      className={`h-9 whitespace-nowrap rounded-md border px-3 text-sm ${
                        group === item
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="py-10 text-center text-sm text-gray-500">Drive 문서를 불러오는 중...</div>
                  ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">표시할 문서가 없습니다.</div>
                  ) : (
                    filtered.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => item.type === 'file' && setSelected(item)}
                        className={`w-full rounded-md border p-3 text-left transition ${
                          selected?.id === item.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {item.type === 'folder' ? (
                            <Folder className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                          ) : (
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-gray-900">{item.name}</div>
                            <div className="mt-1 truncate text-xs text-gray-500">{item.path}</div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                              <span>{getFileKind(item)}</span>
                              {item.modifiedTime && <span>{formatDate(item.modifiedTime)}</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {selected ? (
                  <div className="flex h-[78vh] flex-col">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">{selected.name}</div>
                        <div className="truncate text-xs text-gray-500">{getFileKind(selected)} · {formatDate(selected.modifiedTime)}</div>
                      </div>
                      {selected.webViewLink && (
                        <a
                          href={selected.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Drive
                        </a>
                      )}
                    </div>
                    {selected.previewUrl ? (
                      <iframe
                        title={selected.name}
                        src={selected.previewUrl}
                        className="h-full w-full bg-white"
                        allow="autoplay"
                      />
                    ) : (
                      <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                        미리보기를 지원하지 않는 항목입니다.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-[78vh] items-center justify-center text-sm text-gray-500">
                    왼쪽에서 파일을 선택하세요.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
