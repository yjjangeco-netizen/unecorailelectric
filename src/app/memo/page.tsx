'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'
import { Archive, ArchiveRestore, CheckSquare, ListTodo, Plus, Search, Square, StickyNote, Trash2 } from 'lucide-react'
import { syncWidgetMemos } from '@/lib/widgetSync'

interface TodoItem {
  id: string
  title: string
  completed: boolean
}

type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'white'

type Memo = {
  id: string
  title: string
  content: string
  color: MemoColor
  is_pinned: boolean
  archived: boolean
  updated_at: string
}

const colorStyles: Record<MemoColor, string> = {
  yellow: 'bg-[#fff4b8] border-[#ead46a]',
  blue: 'bg-[#dbeafe] border-[#93c5fd]',
  green: 'bg-[#dcfce7] border-[#86efac]',
  pink: 'bg-[#ffe4e6] border-[#fda4af]',
  purple: 'bg-[#ede9fe] border-[#c4b5fd]',
  white: 'bg-white border-gray-200'
}

const colorDots: Array<{ color: MemoColor; label: string }> = [
  { color: 'yellow', label: '노랑' },
  { color: 'blue', label: '파랑' },
  { color: 'green', label: '초록' },
  { color: 'pink', label: '분홍' },
  { color: 'purple', label: '보라' },
  { color: 'white', label: '흰색' }
]

export default function MemoPage() {
  const { user } = useUser()
  const [memos, setMemos] = useState<Memo[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [tab, setTab] = useState<'memo' | 'todo'>('memo')
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.id || '',
    'x-user-level': String(user?.level || '')
  }), [user?.id, user?.level])

  const filteredMemos = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return memos
    return memos.filter((memo) =>
      `${memo.title} ${memo.content}`.toLowerCase().includes(keyword)
    )
  }, [memos, query])

  useEffect(() => {
    if (!user?.id) return
    loadMemos()
    loadTodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showArchived])

  // 홈 위젯 ＋ (action=new) → 새 메모 생성
  const widgetNewHandled = useRef(false)
  useEffect(() => {
    if (!user?.id) return
    const tryCreate = (action?: string | null) => {
      if (action === 'new' && !widgetNewHandled.current) {
        widgetNewHandled.current = true
        void createMemo()
      }
    }
    if (typeof window !== 'undefined') {
      tryCreate(new URLSearchParams(window.location.search).get('action'))
    }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      if (detail.route === '/memo') tryCreate(detail.action)
    }
    window.addEventListener('widgetNavigate', handler)
    return () => window.removeEventListener('widgetNavigate', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadMemos = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch(`/api/memos?archived=${showArchived}`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '메모 조회 실패')
      setMemos(data)
      // 홈 위젯용 메모 동기화 (보관함이 아닌 활성 메모만)
      if (!showArchived) void syncWidgetMemos(data)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '메모를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const createMemo = async () => {
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: '',
          content: '',
          color: 'yellow',
          is_pinned: false
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '메모 생성 실패')
      setMemos((prev) => [data, ...prev])
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '메모 생성에 실패했습니다.')
    }
  }

  const updateMemo = async (id: string, patch: Partial<Memo>) => {
    setMemos((prev) => prev.map((memo) => memo.id === id ? { ...memo, ...patch } : memo))

    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(patch)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '메모 수정 실패')
      setMemos((prev) => prev.map((memo) => memo.id === id ? data : memo))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '메모 저장에 실패했습니다.')
    }
  }

  const deleteMemo = async (id: string) => {
    if (!confirm('이 메모를 완전히 삭제할까요?')) return

    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
        headers
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '메모 삭제 실패')
      setMemos((prev) => prev.filter((memo) => memo.id !== id))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '메모 삭제에 실패했습니다.')
    }
  }

  // ── 할일(Todo) ────────────────────────────────────────────────
  const loadTodos = async () => {
    try {
      const res = await fetch('/api/todos', { headers })
      const data = await res.json()
      if (!res.ok) return
      const list = (Array.isArray(data) ? data : data.todos || [])
        .filter((t: any) => (t.category || '') !== 'AI 자동화')
        .map((t: any) => ({ id: t.id, title: t.title, completed: !!t.completed }))
      setTodos(list)
    } catch {
      // 무시
    }
  }

  const createTodo = async () => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: '새 할일', category: '메모할일' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '할일 생성 실패')
      setTodos((prev) => [{ id: data.id, title: data.title, completed: !!data.completed }, ...prev])
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '할일 생성에 실패했습니다.')
    }
  }

  const updateTodo = async (id: string, patch: Partial<TodoItem>) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t))
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(patch)
      })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '할일 저장에 실패했습니다.')
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE', headers })
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '할일 삭제에 실패했습니다.')
    }
  }

  return (
    <AuthGuard requiredLevel={1}>
      <div className="min-h-screen bg-[#f4f5f7] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* 메모 / 할일 탭 */}
            <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setTab('memo')}
                className={cn('flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                  tab === 'memo' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100')}
              >
                <StickyNote className="h-4 w-4" /> 메모
              </button>
              <button
                onClick={() => setTab('todo')}
                className={cn('flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                  tab === 'todo' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100')}
              >
                <ListTodo className="h-4 w-4" /> 할일
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {tab === 'memo' ? (
                <>
                  <div className="relative min-w-[240px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="메모 검색"
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setShowArchived((prev) => !prev)}>
                    {showArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                    {showArchived ? '활성 메모' : '보관함'}
                  </Button>
                  <Button onClick={createMemo}>
                    <Plus className="mr-2 h-4 w-4" />
                    새 메모
                  </Button>
                </>
              ) : (
                <Button onClick={createTodo}>
                  <Plus className="mr-2 h-4 w-4" />
                  할일 추가
                </Button>
              )}
            </div>
          </div>

          {status && (
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {status}
            </div>
          )}

          {tab === 'memo' ? (
            loading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
                메모를 불러오는 중...
              </div>
            ) : filteredMemos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
                <StickyNote className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="font-medium text-gray-700">아직 메모가 없습니다.</p>
                <p className="mt-1 text-sm text-gray-500">새 메모를 눌러 첫 메모를 남겨보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredMemos.map((memo) => (
                  <MemoCard
                    key={memo.id}
                    memo={memo}
                    onUpdate={(patch) => updateMemo(memo.id, patch)}
                    onDelete={() => deleteMemo(memo.id)}
                  />
                ))}
              </div>
            )
          ) : (
            todos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
                <ListTodo className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="font-medium text-gray-700">할일이 없습니다.</p>
                <p className="mt-1 text-sm text-gray-500">할일 추가를 눌러 새 할일을 만들어보세요.</p>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-2">
                {todos.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    onToggle={() => updateTodo(todo.id, { completed: !todo.completed })}
                    onTitle={(title) => updateTodo(todo.id, { title })}
                    onDelete={() => deleteTodo(todo.id)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

function MemoCard({
  memo,
  onUpdate,
  onDelete
}: {
  memo: Memo
  onUpdate: (patch: Partial<Memo>) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(memo.title)
  const [content, setContent] = useState(memo.content)

  useEffect(() => {
    setTitle(memo.title)
    setContent(memo.content)
  }, [memo.title, memo.content])

  return (
    <article className={cn('flex min-h-[260px] flex-col rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md', colorStyles[memo.color])}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onUpdate({ title })}
          placeholder="제목"
          className="min-w-0 flex-1 bg-transparent text-base font-bold text-gray-900 outline-none placeholder:text-gray-500"
        />
        <button
          onClick={() => onUpdate({ is_pinned: !memo.is_pinned })}
          className={cn(
            'rounded px-2 py-1 text-xs font-bold',
            memo.is_pinned ? 'bg-gray-900 text-white' : 'bg-white/50 text-gray-500'
          )}
          title="고정"
        >
          PIN
        </button>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => onUpdate({ content })}
        placeholder="메모를 입력하세요"
        className="min-h-[150px] flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-6 text-gray-800 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {colorDots.map((dot) => (
            <button
              key={dot.color}
              onClick={() => onUpdate({ color: dot.color })}
              className={cn(
                'h-5 w-5 rounded-full border border-black/10',
                colorStyles[dot.color],
                memo.color === dot.color && 'ring-2 ring-gray-900 ring-offset-1'
              )}
              title={dot.label}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ archived: !memo.archived })}
            className="rounded p-1.5 text-gray-600 hover:bg-white/50"
            title={memo.archived ? '보관 해제' : '보관'}
          >
            {memo.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-gray-600 hover:bg-white/50 hover:text-red-600"
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function TodoRow({
  todo,
  onToggle,
  onTitle,
  onDelete
}: {
  todo: TodoItem
  onToggle: () => void
  onTitle: (title: string) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(todo.title)

  useEffect(() => {
    setTitle(todo.title)
  }, [todo.title])

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <button
        onClick={onToggle}
        title="완료 토글"
        className={cn('shrink-0', todo.completed ? 'text-blue-600' : 'text-gray-400')}
      >
        {todo.completed ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
      </button>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => { if (title !== todo.title) onTitle(title) }}
        placeholder="할일 내용"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400',
          todo.completed && 'text-gray-400 line-through'
        )}
      />
      <button
        onClick={onDelete}
        className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
        title="삭제"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
