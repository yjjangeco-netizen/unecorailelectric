'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'

type PostListItem = {
  id: string
  title: string
  author_name: string
  created_at: string
  views: number
}
type PostDetail = PostListItem & { content: string }

type Prefixes = { machines?: string[]; versions?: string[] }

// 재사용 게시판 — 리치텍스트 본문, 말머리(장비/버전), 접근레벨 제어.
// board_type 으로 게시판을 구분한다. (/api/boards 사용)
export default function PostBoard({
  boardType,
  title,
  description,
  prefixes,
  minLevel = 1
}: {
  boardType: string
  title: string
  description?: string
  prefixes?: Prefixes
  minLevel?: number
}) {
  const { user } = useUser()
  const userId = user?.id || user?.username || ''
  const headers = useMemo(
    () => (userId ? { 'x-user-id': String(userId) } : undefined),
    [userId]
  )
  const level = Number(user?.level || 0)
  const canAccess = level >= minLevel || String(user?.level || '').toLowerCase() === 'administrator'

  const [mode, setMode] = useState<'list' | 'write' | 'view'>('list')
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [current, setCurrent] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  // 작성 폼
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formMachine, setFormMachine] = useState(prefixes?.machines?.[0] || '')
  const [formVersion, setFormVersion] = useState(prefixes?.versions?.[0] || '')
  const [saving, setSaving] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boards?boardType=${encodeURIComponent(boardType)}`, { cache: 'no-store' })
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [boardType])

  useEffect(() => {
    if (canAccess) loadPosts()
  }, [canAccess, loadPosts])

  const openPost = async (id: string) => {
    try {
      const res = await fetch(`/api/boards/${id}`, { cache: 'no-store' })
      const data = await res.json()
      setCurrent(data)
      setMode('view')
    } catch {
      setMsg('게시글을 불러오지 못했습니다.')
    }
  }

  const submitPost = async () => {
    if (!formTitle.trim()) {
      setMsg('제목을 입력하세요.')
      return
    }
    if (saving) return
    setSaving(true)
    setMsg('')
    const tag = [formMachine, formVersion].filter((v) => v && v !== '공통').join('·')
    const finalTitle = tag ? `[${tag}] ${formTitle.trim()}` : formTitle.trim()
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({
          boardType,
          title: finalTitle,
          content: formContent || '<p></p>',
          authorName: user?.name || user?.username || '관리자'
        })
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.error || '등록 실패')
      }
      setFormTitle('')
      setFormContent('')
      setMode('list')
      loadPosts()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) => p.title.toLowerCase().includes(q))
  }, [posts, search])

  const fmtDate = (s: string) =>
    s ? new Date(s).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) : ''

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="mt-3 text-sm text-gray-600">이 게시판은 레벨 {minLevel} 이상만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
          {mode === 'list' && (
            <Button onClick={() => { setMode('write'); setMsg('') }} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> 글쓰기
            </Button>
          )}
          {mode !== 'list' && (
            <Button variant="outline" onClick={() => { setMode('list'); setCurrent(null) }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 목록
            </Button>
          )}
        </div>

        {msg && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{msg}</div>}

        {mode === 'list' && (
          <Card>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="제목 검색 (말머리 포함)"
                  className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              {loading ? (
                <p className="py-8 text-center text-sm text-gray-500">불러오는 중...</p>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">등록된 글이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => openPost(p.id)}
                        className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left hover:bg-gray-50"
                      >
                        <span className="truncate font-medium text-gray-800">{p.title}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {p.author_name} · {fmtDate(p.created_at)} · 조회 {p.views || 0}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {mode === 'write' && (
          <Card>
            <CardContent className="space-y-3 p-4">
              {prefixes && (
                <div className="flex flex-wrap gap-2">
                  {prefixes.machines && (
                    <select value={formMachine} onChange={(e) => setFormMachine(e.target.value)} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
                      {prefixes.machines.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {prefixes.versions && (
                    <select value={formVersion} onChange={(e) => setFormVersion(e.target.value)} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
                      {prefixes.versions.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  )}
                </div>
              )}
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="제목"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <RichTextEditor value={formContent} onChange={setFormContent} />
              <div className="flex justify-end">
                <Button onClick={submitPost} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {saving ? '저장 중...' : '등록'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'view' && current && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900">{current.title}</h2>
              <p className="mt-1 text-xs text-gray-400">
                {current.author_name} · {fmtDate(current.created_at)} · 조회 {current.views || 0}
              </p>
              <div
                className="prose prose-sm mt-5 max-w-none text-gray-900 [&_a]:text-blue-600 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: current.content || '' }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
