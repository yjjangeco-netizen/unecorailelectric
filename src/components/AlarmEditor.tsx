'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Save, Pencil } from 'lucide-react'

type AlarmItem = {
  key: string
  machine_type: string
  machine_type_label: string
  alarm_code: string
  plc_address: string | null
  message: string
  action: string
  severity: string
  requires_disk: boolean
  ids: string[]
  controllers: string[]
}

const SEVERITIES = ['low', 'normal', 'medium', 'high', 'critical']

export default function AlarmEditor() {
  const [items, setItems] = useState<AlarmItem[]>([])
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [mtFilter, setMtFilter] = useState('all')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/chatbot-alarms/list', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '목록을 불러오지 못했습니다.')
      setItems(data.items || [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const machineTypes = useMemo(
    () => Array.from(new Set(items.map((i) => i.machine_type_label))),
    [items]
  )

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter(
      (i) =>
        (mtFilter === 'all' || i.machine_type_label === mtFilter) &&
        (!query ||
          `${i.alarm_code} ${i.message} ${i.action}`.toLowerCase().includes(query))
    )
  }, [items, mtFilter, q])

  const setField = (key: string, field: keyof AlarmItem, value: unknown) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)))

  const save = async (it: AlarmItem) => {
    setSavingKey(it.key)
    setSavedKey('')
    try {
      const res = await fetch('/api/chatbot-alarms/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ids: it.ids,
          message: it.message,
          action: it.action,
          severity: it.severity,
          requires_disk: it.requires_disk
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '저장 실패')
      setSavedKey(it.key)
      setTimeout(() => setSavedKey(''), 2000)
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pencil className="h-5 w-5 text-blue-600" />
            알람 개별 편집 ({filtered.length})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mtFilter}
              onChange={(e) => setMtFilter(e.target.value)}
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
            >
              <option value="all">전체 기계분류</option>
              {machineTypes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="알람코드·메시지 검색"
              className="h-9 w-48"
            />
            <Button onClick={load} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-2 w-20">분류</th>
                <th className="p-2 w-20">알람</th>
                <th className="p-2 w-28">컨트롤러</th>
                <th className="p-2">메시지</th>
                <th className="p-2">조치</th>
                <th className="p-2 w-24">심각도</th>
                <th className="p-2 w-14">디스크</th>
                <th className="p-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.key} className="border-b align-top hover:bg-gray-50/50">
                  <td className="p-2 text-gray-600">{it.machine_type_label}</td>
                  <td className="p-2 font-mono text-gray-800">{it.alarm_code}</td>
                  <td className="p-2 text-xs text-gray-500">{it.controllers.join(', ')}</td>
                  <td className="p-2">
                    <Input
                      value={it.message}
                      onChange={(e) => setField(it.key, 'message', e.target.value)}
                      className="h-9"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={it.action}
                      onChange={(e) => setField(it.key, 'action', e.target.value)}
                      className="h-9"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={it.severity}
                      onChange={(e) => setField(it.key, 'severity', e.target.value)}
                      className="h-9 w-full rounded-md border border-gray-200 px-1 text-sm"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={it.requires_disk}
                      onChange={(e) => setField(it.key, 'requires_disk', e.target.checked)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      onClick={() => save(it)}
                      disabled={savingKey === it.key}
                      size="sm"
                      className={
                        savedKey === it.key
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {savedKey === it.key ? '완료' : savingKey === it.key ? '...' : '저장'}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    표시할 알람이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
