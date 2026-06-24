'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'
import { Archive, ArchiveRestore, CheckSquare, Plus, Search, Square, StickyNote, Trash2 } from 'lucide-react'
import { syncWidgetMemos } from '@/lib/widgetSync'

type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'white'

type Memo = {
  id: string
  user_id?: string
  title: string
  content: string
  color: MemoColor
  is_pinned: boolean
  archived: boolean
  done: boolean
  share_level: number
  updated_at: string
}

// 공개 범위: 0=나만 보기(본인만), 1~5=해당 레벨 이상 공개, 99=관리자만
const SHARE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: '나만 보기' },
  { value: 1, label: '레벨1 이상' },
  { value: 2, label: '레벨2 이상' },
  { value: 3, label: '레벨3 이상' },
  { value: 4, label: '레벨4 이상' },
  { value: 5, label: '레벨5 이상' },
  { value: 99, label: '관리자만' }
]
const shareLabel = (v: number) => SHARE_OPTIONS.find((o) => o.value === v)?.label ?? '나만 보기'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showArchived])

  // 메모가 바뀔 때마다(생성·수정·삭제·보관) 홈 위젯 저장소를 즉시 갱신해
  // 위젯이 다음 갱신 때 최신 데이터를 읽도록 한다. (활성 메모만 반영)
  useEffect(() => {
    if (!user?.id || showArchived) return
    void syncWidgetMemos(memos)
  }, [memos, showArchived, user?.id])

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
      // 위젯 동기화는 위의 memos 변경 useEffect가 처리
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
          is_pinned: false,
          share_level: 0
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

  return (
    <AuthGuard requiredLevel={1}>
      <div className="min-h-screen bg-[#f4f5f7] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-6 w-6 text-yellow-500" />
              <h1 className="text-xl font-bold text-gray-900">메모 &amp; 할일</h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
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
            </div>
          </div>

          {status && (
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {status}
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
              메모를 불러오는 중...
            </div>
          ) : filteredMemos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
              <StickyNote className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-700">아직 메모가 없습니다.</p>
              <p className="mt-1 text-sm text-gray-500">새 메모를 눌러 첫 메모를 남겨보세요. 앞의 체크박스를 켜면 할일로 쓸 수 있어요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredMemos.map((memo) => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  isOwner={!memo.user_id || memo.user_id === (user?.id || '')}
                  onUpdate={(patch) => updateMemo(memo.id, patch)}
                  onDelete={() => deleteMemo(memo.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

function MemoCard({
  memo,
  isOwner,
  onUpdate,
  onDelete
}: {
  memo: Memo
  isOwner: boolean
  onUpdate: (patch: Partial<Memo>) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(memo.title)
  const [content, setContent] = useState(memo.content)

  useEffect(() => {
    setTitle(memo.title)
    setContent(memo.content)
  }, [memo.title, memo.content])

  const done = !!memo.done

  return (
    <article className={cn(
      'flex min-h-[200px] flex-col rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md',
      colorStyles[memo.color],
      done && 'opacity-60'
    )}>
      <div className="mb-3 flex items-center gap-2">
        {/* 메모 앞 체크박스 = 할일 완료 토글 */}
        <button
          onClick={() => isOwner && onUpdate({ done: !done })}
          disabled={!isOwner}
          className={cn('shrink-0', done ? 'text-blue-600' : 'text-gray-400', !isOwner && 'cursor-default')}
          title={done ? '완료 해제' : '완료'}
        >
          {done ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onUpdate({ title })}
          placeholder="제목"
          readOnly={!isOwner}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-base font-bold text-gray-900 outline-none placeholder:text-gray-500',
            done && 'text-gray-500 line-through'
          )}
        />
        {isOwner && (
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
        )}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => onUpdate({ content })}
        placeholder="메모를 입력하세요"
        readOnly={!isOwner}
        className="min-h-[110px] flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-6 text-gray-800 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      {/* 공유 메모(남의 글) 표시 */}
      {!isOwner && (
        <div className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-white/60 px-2 py-0.5 text-xs text-gray-500">
          공유됨 · {shareLabel(memo.share_level)} · 읽기 전용
        </div>
      )}

      {isOwner && (
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
            {/* 공개 범위 선택 */}
            <select
              value={memo.share_level ?? 0}
              onChange={(e) => onUpdate({ share_level: Number(e.target.value) })}
              className="rounded border border-black/10 bg-white/60 px-1.5 py-1 text-xs text-gray-700 outline-none"
              title="공개 범위"
            >
              {SHARE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
      )}
    </article>
  )
}
