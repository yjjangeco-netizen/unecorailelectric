'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

type TabKey = 'faq' | 'maintenance' | 'symptom'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'faq', label: 'FAQ' },
  { key: 'maintenance', label: '정비항목' },
  { key: 'symptom', label: '증상대응' }
]

type Field = { name: string; label: string; required?: boolean; textarea?: boolean }
const FORMS: Record<TabKey, Field[]> = {
  faq: [
    { name: 'question', label: '질문', required: true },
    { name: 'answer_short', label: '짧은 답변', required: true, textarea: true },
    { name: 'answer_detail', label: '상세 답변', textarea: true },
    { name: 'search_keywords', label: '검색 키워드 (쉼표로 구분)' },
    { name: 'priority', label: '우선순위 (숫자, 기본 3)' }
  ],
  maintenance: [
    { name: 'item_name', label: '정비항목', required: true },
    { name: 'category', label: '분류' },
    { name: 'action_short', label: '짧은 조치', required: true, textarea: true },
    { name: 'action_detail', label: '상세 조치', textarea: true },
    { name: 'interval_days', label: '주기 (일)' },
    { name: 'safety_note', label: '안전 주의', textarea: true }
  ],
  symptom: [
    { name: 'symptom_title', label: '증상명', required: true },
    { name: 'action_short', label: '짧은 조치', required: true, textarea: true },
    { name: 'cause_candidates', label: '원인 후보', textarea: true },
    { name: 'check_order', label: '점검 순서', textarea: true },
    { name: 'search_keywords', label: '검색 키워드 (쉼표로 구분)' }
  ]
}
const LIST_LABEL: Record<TabKey, (r: any) => string> = {
  faq: (r) => r.question,
  maintenance: (r) => r.item_name,
  symptom: (r) => r.symptom_title
}

function KnowledgeManager() {
  const { user } = useUser()
  const userId = user?.id || user?.username || ''
  const headers = useMemo(
    () => (userId ? { 'x-user-id': String(userId) } : undefined),
    [userId]
  )

  const [tab, setTab] = useState<TabKey>('faq')
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (t: TabKey) => {
    try {
      const res = await fetch(`/api/chatbot-knowledge?type=${t}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    load(tab)
  }, [tab, load])

  const submit = async () => {
    if (saving) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/chatbot-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({ type: tab, ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '등록 실패')
      setForm({})
      setMsg('✅ 등록 완료')
      load(tab)
    } catch (e) {
      setMsg('❌ ' + (e instanceof Error ? e.message : '등록 실패'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('이 항목을 삭제할까요?')) return
    await fetch(`/api/chatbot-knowledge?type=${tab}&id=${id}`, { method: 'DELETE', headers })
    load(tab)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">챗봇 지식관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          FAQ·정비·증상 답변을 등록하면 QR 챗봇이 답변에 사용합니다. (공통 항목으로 등록)
        </p>

        <div className="mt-5 flex gap-2">
          {TABS.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'outline'}
              onClick={() => {
                setTab(t.key)
                setForm({})
                setMsg('')
              }}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}

        <Card className="mt-4">
          <CardContent className="space-y-3 p-4">
            {FORMS[tab].map((f) => (
              <label key={f.name} className="block">
                <span className="text-sm font-medium text-gray-700">
                  {f.label}
                  {f.required ? ' *' : ''}
                </span>
                {f.textarea ? (
                  <textarea
                    value={form[f.name] || ''}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <input
                    value={form[f.name] || ''}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                )}
              </label>
            ))}
            <div className="flex justify-end">
              <Button onClick={submit} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                {saving ? '저장 중...' : '등록'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">등록된 항목이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm text-gray-800">{LIST_LABEL[tab](r)}</span>
                    <button
                      onClick={() => remove(r.id)}
                      className="shrink-0 text-gray-400 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ChatbotKnowledgePage() {
  return (
    <AuthGuard requiredLevel={4}>
      <KnowledgeManager />
    </AuthGuard>
  )
}
