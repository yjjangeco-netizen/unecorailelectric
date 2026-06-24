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
  minLevel = 1,
  chatbotSync = false
}: {
  boardType: string
  title: string
  description?: string
  prefixes?: Prefixes
  minLevel?: number
  chatbotSync?: boolean
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
  const [searchField, setSearchField] = useState<'title' | 'author'>('title')
  const [page, setPage] = useState(1)
  const [msg, setMsg] = useState('')

  const PAGE_SIZE = 15

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
      const created = await res.json().catch(() => null)
      // 챗봇 연동 게시판이면 QR 챗봇 의미검색 색인에 반영(실패해도 글 등록은 유지)
      if (chatbotSync && created?.id) {
        try {
          await fetch('/api/chatbot-boards/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(headers || {}) },
            body: JSON.stringify({
              postId: created.id,
              title: finalTitle,
              html: formContent,
              machine: formMachine,
              version: formVersion
            })
          })
        } catch {
          /* 색인 실패는 무시 */
        }
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
    return posts.filter((p) => {
      const target = searchField === 'author' ? p.author_name : p.title
      return (target || '').toLowerCase().includes(q)
    })
  }, [posts, search, searchField])

  // 검색어/필드 변경 또는 글 갱신 시 1페이지로
  useEffect(() => { setPage(1) }, [search, searchField, posts])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

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
            <CardContent className="p-0">
              {/* 게시판형 목록 (번호·제목·작성자·작성일·조회·파일) */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-gray-300 bg-gray-50 text-gray-600">
                      <th className="w-16 px-3 py-3 text-center font-semibold">번호</th>
                      <th className="px-3 py-3 text-left font-semibold">제목</th>
                      <th className="w-28 px-3 py-3 text-center font-semibold">작성자</th>
                      <th className="w-28 px-3 py-3 text-center font-semibold">작성일</th>
                      <th className="w-16 px-3 py-3 text-center font-semibold">조회</th>
                      <th className="w-14 px-3 py-3 text-center font-semibold">파일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">불러오는 중...</td>
                      </tr>
                    ) : paged.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">등록된 글이 없습니다.</td>
                      </tr>
                    ) : (
                      paged.map((p, i) => {
                        const no = filtered.length - ((pageSafe - 1) * PAGE_SIZE + i)
                        return (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-blue-50/40">
                            <td className="px-3 py-3 text-center text-gray-500">{no}</td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => openPost(p.id)}
                                className="text-left font-medium text-gray-800 hover:text-blue-600 hover:underline"
                              >
                                {p.title}
                              </button>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-600">{p.author_name}</td>
                            <td className="px-3 py-3 text-center text-gray-500">{fmtDate(p.created_at)}</td>
                            <td className="px-3 py-3 text-center text-gray-500">{p.views || 0}</td>
                            <td className="px-3 py-3 text-center text-gray-400">-</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-center gap-1 py-5">
                <button
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  disabled={pageSafe <= 1}
                  className="rounded px-2 py-1 text-sm text-gray-500 disabled:opacity-30 hover:bg-gray-100"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={
                      n === pageSafe
                        ? 'min-w-8 rounded bg-gray-800 px-2 py-1 text-sm font-semibold text-white'
                        : 'min-w-8 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100'
                    }
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                  disabled={pageSafe >= totalPages}
                  className="rounded px-2 py-1 text-sm text-gray-500 disabled:opacity-30 hover:bg-gray-100"
                >
                  다음
                </button>
              </div>

              {/* 하단 검색 */}
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 py-4">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as 'title' | 'author')}
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="title">제목</option>
                  <option value="author">작성자</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="검색어 입력"
                    className="rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
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
