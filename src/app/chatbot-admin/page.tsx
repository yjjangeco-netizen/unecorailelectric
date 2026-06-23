'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Pencil, X } from 'lucide-react'

// QR 챗봇 통합 관리자 (hectoraaa admin 포팅): 프로젝트/알람/FAQ/정비/증상
type EntityKey = 'profile' | 'alarm' | 'faq' | 'maintenance' | 'symptom'

const MACHINE_TYPES: [string, string][] = [
  ['lathe', '선반'],
  ['wheel_lathe', '전삭기'],
  ['tandem', '탠덤'],
  ['disc_lathe', '디스크선반'],
  ['tram', '트램']
]
const HARDWARE_VERSIONS: [string, string][] = [
  ['sinumerik_840c', '840C'],
  ['sinumerik_840d', '840D'],
  ['sinumerik_840dsl', '840Dsl'],
  ['sinumerik_one', 'One'],
  ['fanuc', 'Fanuc']
]
const VISIBILITY: [string, string][] = [
  ['public', 'public - 누구나'],
  ['customer', 'customer - 고객'],
  ['partner', 'partner - 협력사'],
  ['internal', 'internal - 내부'],
  ['admin', 'admin - 관리자']
]
const SEVERITY = ['', 'low', 'normal', 'medium', 'high', 'critical']
const MAINTENANCE_TYPE = ['', 'daily', 'weekly', 'monthly', 'periodic', 'condition_based', 'manual']

type Field = {
  name: string
  label: string
  required?: boolean
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'machineType' | 'hardwareVersion' | 'visibility'
  options?: string[]
  defaultValue?: any
}

const ENTITIES: { key: EntityKey; label: string; titleField: string; fields: Field[] }[] = [
  {
    key: 'profile',
    label: '프로젝트',
    titleField: 'display_name',
    fields: [
      { name: 'display_name', label: '현장명/프로젝트명', required: true },
      { name: 'machine_type', label: '기계분류', type: 'machineType', defaultValue: 'wheel_lathe' },
      { name: 'hardware_version', label: '하드웨어 버전', type: 'hardwareVersion', defaultValue: 'sinumerik_one' },
      { name: 'machine_code', label: '장비코드(비우면 자동)' },
      { name: 'version_code', label: '버전코드(비우면 자동)' },
      { name: 'customer_name', label: '고객사' },
      { name: 'plc_model', label: 'PLC 모델' },
      { name: 'hmi_model', label: 'HMI 모델' },
      { name: 'software_version', label: '소프트웨어 버전' },
      { name: 'note', label: '메모', type: 'textarea' }
    ]
  },
  {
    key: 'alarm',
    label: '알람',
    titleField: 'alarm_code',
    fields: [
      { name: 'alarm_code', label: '알람번호', required: true },
      { name: 'plc_address', label: 'PLC 주소' },
      { name: 'category', label: '분류', defaultValue: 'general' },
      { name: 'source', label: '소스/버전', defaultValue: 'ONE' },
      { name: 'severity', label: '심각도', type: 'select', options: SEVERITY },
      { name: 'display_priority', label: '우선순위', type: 'number', defaultValue: 3 },
      { name: 'alarm_title', label: '알람 제목' },
      { name: 'message_original', label: '알람 메시지', type: 'textarea', required: true },
      { name: 'cause', label: '원인', type: 'textarea' },
      { name: 'action_short', label: '짧은 조치', type: 'textarea', required: true },
      { name: 'action_detail', label: '상세 조치', type: 'textarea' },
      { name: 'search_keywords', label: '검색 키워드(쉼표)', type: 'textarea' },
      { name: 'visibility', label: '공개 범위', type: 'visibility', defaultValue: 'public' }
    ]
  },
  {
    key: 'faq',
    label: 'FAQ',
    titleField: 'question',
    fields: [
      { name: 'question', label: '질문', required: true },
      { name: 'answer_short', label: '짧은 답변', type: 'textarea', required: true },
      { name: 'answer_detail', label: '상세 답변', type: 'textarea' },
      { name: 'category', label: '분류', defaultValue: 'faq' },
      { name: 'priority', label: '우선순위', type: 'number', defaultValue: 3 },
      { name: 'search_keywords', label: '검색 키워드(쉼표)', type: 'textarea' },
      { name: 'visibility', label: '공개 범위', type: 'visibility', defaultValue: 'public' }
    ]
  },
  {
    key: 'maintenance',
    label: '정비',
    titleField: 'item_name',
    fields: [
      { name: 'item_name', label: '정비항목', required: true },
      { name: 'category', label: '분류', defaultValue: 'maintenance' },
      { name: 'maintenance_type', label: '주기 유형', type: 'select', options: MAINTENANCE_TYPE },
      { name: 'interval_days', label: '주기(일)', type: 'number' },
      { name: 'interval_months', label: '주기(개월)', type: 'number' },
      { name: 'consumable_spec', label: '소모품 규격' },
      { name: 'required_tools', label: '필요 공구(쉼표)' },
      { name: 'safety_note', label: '안전 주의', type: 'textarea' },
      { name: 'action_short', label: '짧은 조치', type: 'textarea', required: true },
      { name: 'action_detail', label: '상세 조치', type: 'textarea' },
      { name: 'visibility', label: '공개 범위', type: 'visibility', defaultValue: 'public' }
    ]
  },
  {
    key: 'symptom',
    label: '증상',
    titleField: 'symptom_title',
    fields: [
      { name: 'symptom_title', label: '증상명', required: true },
      { name: 'search_keywords', label: '검색 키워드(쉼표)', type: 'textarea' },
      { name: 'cause_candidates', label: '원인 후보', type: 'textarea' },
      { name: 'check_order', label: '점검 순서', type: 'textarea' },
      { name: 'action_short', label: '짧은 조치', type: 'textarea', required: true },
      { name: 'action_detail', label: '상세 조치', type: 'textarea' },
      { name: 'related_alarm_codes', label: '관련 알람번호(쉼표)' },
      { name: 'priority', label: '우선순위', type: 'number', defaultValue: 3 },
      { name: 'visibility', label: '공개 범위', type: 'visibility', defaultValue: 'public' }
    ]
  }
]

function labelOf(opts: [string, string][], v: string) {
  return opts.find((o) => o[0] === v)?.[1] || v || ''
}

function AdminConsole() {
  const { user } = useUser()
  const userId = user?.id || user?.username || ''
  const headers = useMemo(
    () => (userId ? { 'Content-Type': 'application/json', 'x-user-id': String(userId) } : undefined),
    [userId]
  )

  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') || '') as EntityKey
  const [entity, setEntity] = useState<EntityKey>(
    ENTITIES.some((e) => e.key === tabParam) ? tabParam : 'profile'
  )
  // 사이드바에서 ?tab= 으로 들어오면 탭 전환(같은 페이지 내 쿼리 변경 대응)
  useEffect(() => {
    if (tabParam && ENTITIES.some((e) => e.key === tabParam)) {
      setEntity(tabParam)
      setShowForm(false)
    }
  }, [tabParam])
  const cfg = ENTITIES.find((e) => e.key === entity)!

  const [profiles, setProfiles] = useState<any[]>([])
  const [profileId, setProfileId] = useState<string>('') // '' = 공통/전체
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [csvUploading, setCsvUploading] = useState(false)

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCsvUploading(true)
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/chatbot-alarms/import', {
        method: 'POST',
        headers: userId ? { 'x-user-id': String(userId) } : undefined,
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'CSV 업로드 실패')
      setMsg(`✅ CSV 일괄등록 완료${data['입력행'] ? `: ${data['입력행']}행` : ''}`)
      loadItems()
    } catch (err) {
      setMsg('❌ ' + (err instanceof Error ? err.message : 'CSV 업로드 실패'))
    } finally {
      setCsvUploading(false)
    }
  }

  const loadProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/chatbot-admin?entity=profile', { cache: 'no-store' })
      const data = await res.json()
      setProfiles(Array.isArray(data.items) ? data.items : [])
    } catch {
      setProfiles([])
    }
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const url =
        entity === 'profile'
          ? '/api/chatbot-admin?entity=profile'
          : `/api/chatbot-admin?entity=${entity}${profileId ? `&profileId=${profileId}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [entity, profileId])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const openCreate = () => {
    const init: Record<string, any> = {}
    cfg.fields.forEach((f) => {
      if (f.defaultValue !== undefined) init[f.name] = f.defaultValue
    })
    setForm(init)
    setEditId(null)
    setShowForm(true)
    setMsg('')
  }
  const openEdit = (row: any) => {
    const init: Record<string, any> = {}
    cfg.fields.forEach((f) => {
      const v = row[f.name]
      init[f.name] = Array.isArray(v) ? v.join(', ') : v ?? ''
    })
    setForm(init)
    setEditId(row.id)
    setShowForm(true)
    setMsg('')
  }

  const buildPayload = (): Record<string, any> => {
    const p: Record<string, any> = { ...form }
    if (entity === 'profile') {
      const mt = p.machine_type || 'wheel_lathe'
      const hw = p.hardware_version || 'sinumerik_one'
      if (!p.machine_code) p.machine_code = String(p.display_name || 'M').toUpperCase().replace(/[^A-Z0-9]+/g, '_')
      if (!p.version_code) p.version_code = `${mt}_${hw}`.toUpperCase()
      p.machine_name = labelOf(MACHINE_TYPES, mt)
      p.cnc_model = labelOf(HARDWARE_VERSIONS, hw)
      p.machine_type = mt
      p.hardware_version = hw
    } else {
      p.machine_profile_id = profileId || null
      if (entity === 'alarm' && !p.alarm_title) p.alarm_title = p.message_original
    }
    return p
  }

  const submit = async () => {
    const required = cfg.fields.filter((f) => f.required)
    for (const f of required) {
      if (!String(form[f.name] || '').trim()) {
        setMsg(`❌ ${f.label}은(는) 필수입니다.`)
        return
      }
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/chatbot-admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ entity, id: editId || undefined, payload: buildPayload() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '저장 실패')
      setShowForm(false)
      setMsg('✅ 저장 완료')
      if (entity === 'profile') loadProfiles()
      loadItems()
    } catch (e) {
      setMsg('❌ ' + (e instanceof Error ? e.message : '저장 실패'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('이 항목을 삭제할까요?')) return
    await fetch(`/api/chatbot-admin?entity=${entity}&id=${id}`, { method: 'DELETE', headers })
    if (entity === 'profile') loadProfiles()
    loadItems()
  }

  const rowTitle = (row: any) => {
    if (entity === 'profile')
      return `${row.display_name || '-'} (${labelOf(MACHINE_TYPES, row.machine_type)}/${labelOf(HARDWARE_VERSIONS, row.hardware_version)})`
    if (entity === 'alarm') return `${row.alarm_code} ${row.alarm_title || row.message_original || ''}`
    return row[cfg.titleField] || '-'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">챗봇 관리자</h1>
        <p className="mt-1 text-sm text-gray-600">
          QR 챗봇이 사용하는 프로젝트·알람·FAQ·정비·증상을 한곳에서 관리합니다.
        </p>

        {/* 엔티티 탭 */}
        <div className="mt-5 flex flex-wrap gap-2">
          {ENTITIES.map((e) => (
            <Button
              key={e.key}
              variant={entity === e.key ? 'default' : 'outline'}
              onClick={() => {
                setEntity(e.key)
                setShowForm(false)
                setMsg('')
              }}
            >
              {e.label}
            </Button>
          ))}
        </div>

        {/* 프로젝트 선택 (알람/FAQ/정비/증상) */}
        {entity !== 'profile' && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">대상:</span>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm"
            >
              <option value="">공통(전체 장비)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} / {p.machine_code}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-400">선택한 대상으로 등록·조회됩니다</span>
          </div>
        )}

        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}

        <div className="mt-4 flex justify-end gap-2">
          {entity === 'alarm' && !showForm && (
            <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {csvUploading ? 'CSV 업로드 중...' : 'CSV 일괄등록'}
              <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} disabled={csvUploading} />
            </label>
          )}
          {!showForm ? (
            <Button onClick={openCreate} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              {cfg.label} 추가
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setShowForm(false)}>
              <X className="mr-2 h-4 w-4" /> 닫기
            </Button>
          )}
        </div>

        {/* 작성/수정 폼 */}
        {showForm && (
          <Card className="mt-3">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              {cfg.fields.map((f) => {
                const val = form[f.name] ?? ''
                const wide = f.type === 'textarea'
                return (
                  <label key={f.name} className={wide ? 'sm:col-span-2' : ''}>
                    <span className="text-sm font-medium text-gray-700">
                      {f.label}
                      {f.required ? ' *' : ''}
                    </span>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={val}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                        rows={2}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    ) : f.type === 'select' || f.type === 'machineType' || f.type === 'hardwareVersion' || f.type === 'visibility' ? (
                      <select
                        value={val}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {(f.type === 'machineType'
                          ? MACHINE_TYPES
                          : f.type === 'hardwareVersion'
                            ? HARDWARE_VERSIONS
                            : f.type === 'visibility'
                              ? VISIBILITY
                              : (f.options || []).map((o) => [o, o || '선택 안 함'] as [string, string])
                        ).map(([v, l]) => (
                          <option key={v || 'empty'} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={val}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </label>
                )
              })}
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={submit} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {saving ? '저장 중...' : editId ? '수정 저장' : '등록'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 목록 */}
        <Card className="mt-4">
          <CardContent className="p-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-500">불러오는 중...</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">등록된 항목이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm text-gray-800">{rowTitle(row)}</span>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => openEdit(row)} className="text-gray-400 hover:text-blue-600" title="수정">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(row.id)} className="text-gray-400 hover:text-red-600" title="삭제">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

export default function ChatbotAdminPage() {
  return (
    <AuthGuard requiredLevel={4}>
      <Suspense fallback={<div className="p-8 text-sm text-gray-500">불러오는 중...</div>}>
        <AdminConsole />
      </Suspense>
    </AuthGuard>
  )
}
