'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { isAssistantOwner } from '@/lib/assistantAccess'
import { assistantFeatureLabels, defaultAssistantSettings, type AssistantFeatureSettings } from '@/lib/assistantAutomation'
import { Bot, CalendarDays, CheckCircle, FileAudio, MessageSquare, Receipt, Save, Sparkles } from 'lucide-react'

type SettingsResponse = {
  settings: AssistantFeatureSettings
  google_calendar_id?: string
  google_business_calendar_id?: string
  google_personal_calendar_id?: string
  google_task_list_name?: string
  google_drive_folder_id?: string
  morning_brief_time?: string
  work_report_reminder_time?: string
  google_connected?: boolean
  setupRequired?: boolean
  setupSql?: string
}

type AnalysisLog = {
  id: string
  source_type: string
  source_title: string
  summary: string
  todos: Array<{ title: string }>
  events: Array<{ title: string }>
  improvements: string[]
  risks: string[]
  status: string
  created_at: string
}

export default function AssistantAutomationPage() {
  const { user } = useUser()
  const owner = isAssistantOwner(user)
  const [settings, setSettings] = useState<AssistantFeatureSettings>(defaultAssistantSettings)
  const [businessCalendarId, setBusinessCalendarId] = useState('Unecorail')
  const [personalCalendarId, setPersonalCalendarId] = useState('개인일정')
  const [taskListName, setTaskListName] = useState('Unecorail')
  const [driveFolderId, setDriveFolderId] = useState('')
  const [morningBriefTime, setMorningBriefTime] = useState('08:01')
  const [workReportReminderTime, setWorkReportReminderTime] = useState('16:30')
  const [status, setStatus] = useState('')
  const [sampleText, setSampleText] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [analysisLogId, setAnalysisLogId] = useState('')
  const [logs, setLogs] = useState<AnalysisLog[]>([])
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.id || '',
    'x-user-level': String(user?.level || ''),
    'x-user-username': user?.username || ''
  }), [user?.id, user?.level, user?.username])

  const loadPendingItems = useCallback(() => {
    if (!user?.id || !owner) return
    fetch('/api/assistant/google/pending', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPendingItems(data)
        }
      })
      .catch(() => console.error('대기 항목 조회 실패'))
  }, [headers, owner, user?.id])

  const loadLogs = useCallback(() => {
    if (!user?.id || !owner) return
    fetch('/api/assistant/analyze', { headers })
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch(() => setStatus('분석 기록 조회에 실패했습니다.'))
  }, [headers, owner, user?.id])

  useEffect(() => {
    if (!user?.id || !owner) return

    fetch('/api/assistant/settings', { headers })
      .then((res) => res.json())
      .then((data: SettingsResponse) => {
        setSettings({ ...defaultAssistantSettings, ...(data.settings || {}) })
        setBusinessCalendarId(data.google_business_calendar_id || data.google_calendar_id || 'Unecorail')
        setPersonalCalendarId(data.google_personal_calendar_id || '개인일정')
        setTaskListName(data.google_task_list_name || 'Unecorail')
        setDriveFolderId(data.google_drive_folder_id || '')
        setMorningBriefTime(data.morning_brief_time || '08:01')
        setWorkReportReminderTime(data.work_report_reminder_time || '16:30')
        if (data.setupRequired) setStatus(`DB 설정 필요: ${data.setupSql}`)
      })
      .catch(() => setStatus('설정 조회에 실패했습니다.'))

    loadLogs()
    loadPendingItems()
  }, [headers, loadLogs, loadPendingItems, owner, user?.id])

  const toggleSetting = (key: keyof AssistantFeatureSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const saveSettings = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          settings,
          google_business_calendar_id: businessCalendarId,
          google_personal_calendar_id: personalCalendarId,
          google_task_list_name: taskListName,
          google_drive_folder_id: driveFolderId,
          morning_brief_time: morningBriefTime,
          work_report_reminder_time: workReportReminderTime
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '저장 실패')
      setStatus('설정이 저장됐습니다.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '설정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const connectGoogle = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/google/connect', { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google 연결 준비 실패')
      window.location.href = data.url
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_type: 'manual',
          source_title: '수동 대화 분석',
          text: sampleText
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '분석 실패')
      setAnalysis(data.analysis)
      setAnalysisLogId(data.log?.id || '')
      setStatus(data.saved ? '분석 결과가 기록됐습니다.' : `분석은 완료, 저장은 대기: ${data.setupSql || data.error}`)
      loadLogs()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '분석에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const applyAnalysis = async () => {
    if (!analysisLogId) {
      setStatus('저장된 분석 로그가 없어 반영할 수 없습니다.')
      return
    }

    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({ logId: analysisLogId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '반영 실패')
      setStatus(`할 일 ${data.todoCount}건, 일정 ${data.eventCount}건을 반영했습니다.`)
      loadLogs()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '분석 결과 반영에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const saveAnalysisMemo = async () => {
    if (!analysisLogId) {
      setStatus('저장된 분석 로그가 없어 메모로 저장할 수 없습니다.')
      return
    }

    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/memo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ logId: analysisLogId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || '메모 저장 실패')
      setStatus('분석 결과를 메모로 저장했습니다.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '분석 결과 메모 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const syncGoogleCalendar = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/google/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google Calendar 동기화 실패')
      setStatus(`Google Calendar 동기화 완료: 사이트→Google ${data.pushed}건, 업데이트 ${data.updated}건, Google→사이트 ${data.pulled}건`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google Calendar 동기화에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const syncGoogleCalendarClassify = async () => {
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/api/assistant/google/pull-classify', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '스마트 분류 동기화 실패')
      
      let statusMsg = `스마트 분류 동기화 완료: 사이트→Google ${data.data?.pushed || 0}건, 업데이트 ${data.data?.updated || 0}건`
      if (data.data?.pulled > 0) {
        statusMsg += `, Google→사이트(신규분류) ${data.data?.pulled || 0}건`
      }
      if (data.data?.pendingUpdates > 0) {
        statusMsg += `, 수동 업데이트 대기 ${data.data?.pendingUpdates || 0}건`
      }
      setStatus(statusMsg)
      loadPendingItems()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '스마트 분류 동기화에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyPending = async (linkId: string) => {
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/api/assistant/google/pending', {
        method: 'POST',
        headers,
        body: JSON.stringify({ linkId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '수동 업데이트 반영 실패')
      setStatus('일정이 정상적으로 웹사이트에 반영되었습니다.')
      loadPendingItems()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '수동 업데이트 반영에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAllPending = async () => {
    if (pendingItems.length === 0) return
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/api/assistant/google/pending', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          linkId: pendingItems.map(item => item.id),
          action: 'apply_all'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '전체 수동 업데이트 반영 실패')
      setStatus('모든 대기 일정이 정상적으로 반영되었습니다.')
      loadPendingItems()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '전체 수동 업데이트 반영에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const saveDriveReport = async (logId: string) => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/google/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({ logId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Drive 리포트 저장 실패')
      setStatus(`Google Drive에 리포트를 저장했습니다: ${data.file?.name || data.file?.id}`)
      loadLogs()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google Drive 리포트 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const syncGoogleTasks = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/google/tasks/sync', {
        method: 'POST',
        headers
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google Tasks 동기화 실패')
      setStatus(`Google Tasks 동기화 완료: 추가 ${data.pushed}건, 업데이트 ${data.updated}건`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google Tasks 동기화에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const createDailySummary = async () => {
    setLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/assistant/daily-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '하루 일지 생성 실패')
      setStatus(`Google Docs 하루 일지를 Drive에 저장했습니다: ${data.file?.name || data.file?.id}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '하루 일지 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (user && !owner) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f4f5f7] p-6">
          <Card className="mx-auto max-w-xl rounded-lg border-gray-200">
            <CardHeader>
              <CardTitle>개인 비서 전용 메뉴</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              AI 자동화는 yjjang 개인 계정으로 로그인했을 때만 사용할 수 있습니다.
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f4f5f7] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-950">개인 AI 비서</h1>
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">yjjang only</Badge>
            </div>
            <p className="text-sm text-gray-500">
              텔레그램 대화와 수동 기록을 자동으로 분석해 요약, 할 일, 일정 후보, 개선점을 기록합니다.
            </p>
          </div>

          {status && (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {status}
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="rounded-lg border-gray-200 xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  자동화 기능
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assistantFeatureLabels.map((feature) => (
                  <div key={feature.key} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white p-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-xs leading-5 text-gray-500">{feature.description}</p>
                    </div>
                    <Switch checked={settings[feature.key]} onCheckedChange={() => toggleSetting(feature.key)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  Google 연결 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCalendarId">업무용 Calendar</Label>
                  <Input id="businessCalendarId" value={businessCalendarId} onChange={(event) => setBusinessCalendarId(event.target.value)} placeholder="Unecorail" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personalCalendarId">개인용 Calendar</Label>
                  <Input id="personalCalendarId" value={personalCalendarId} onChange={(event) => setPersonalCalendarId(event.target.value)} placeholder="개인일정" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driveFolderId">Drive Folder ID</Label>
                  <Input id="driveFolderId" value={driveFolderId} onChange={(event) => setDriveFolderId(event.target.value)} placeholder="비워두면 Unecorail 폴더 자동 사용" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskListName">Google Tasks 목록</Label>
                  <Input id="taskListName" value={taskListName} onChange={(event) => setTaskListName(event.target.value)} placeholder="Unecorail" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morningBriefTime">아침 알림 시간</Label>
                  <Input id="morningBriefTime" type="time" value={morningBriefTime} onChange={(event) => setMorningBriefTime(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workReportReminderTime">업무보고 알림 시간</Label>
                  <Input id="workReportReminderTime" type="time" value={workReportReminderTime} onChange={(event) => setWorkReportReminderTime(event.target.value)} />
                </div>
                <Button onClick={saveSettings} disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  설정 저장
                </Button>
                <Button onClick={connectGoogle} disabled={loading} variant="outline" className="w-full">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Google 연결
                </Button>
                <Button onClick={syncGoogleCalendarClassify} disabled={loading} variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <Sparkles className="mr-2 h-4 w-4" />
                  스마트 분류 동기화
                </Button>
                <Button onClick={syncGoogleCalendar} disabled={loading} variant="outline" className="w-full">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Calendar 양방향 동기화
                </Button>
                <Button onClick={syncGoogleTasks} disabled={loading} variant="outline" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Google 할 일 동기화
                </Button>
                <Button onClick={createDailySummary} disabled={loading} variant="outline" className="w-full">
                  <FileAudio className="mr-2 h-4 w-4" />
                  오늘 하루 일지 저장
                </Button>
              </CardContent>
            </Card>
          </section>

          {pendingItems.length > 0 && (
            <Card className="rounded-lg border-amber-200 bg-amber-50/5">
              <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-amber-900">
                  <CalendarDays className="h-5 w-5 text-amber-500" />
                  업데이트 필요 항목 ({pendingItems.length}건)
                </CardTitle>
                <Button size="sm" onClick={handleApplyAllPending} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-medium">
                  전체 업데이트 반영
                </Button>
              </CardHeader>
              <CardContent className="divide-y divide-amber-100/40 p-0">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/50">
                          {item.local_table === 'business_trips' ? '출장/외근' : item.local_table === 'leave_requests' ? '휴가' : '일반일정'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          구글 수정일: {new Date(item.google_updated_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-950">{item.google_summary}</h4>
                      {item.google_description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{item.google_description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {item.google_html_link && (
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none border-gray-200" asChild>
                          <a href={item.google_html_link} target="_blank" rel="noopener noreferrer">
                            구글에서 보기
                          </a>
                        </Button>
                      )}
                      <Button size="sm" onClick={() => handleApplyPending(item.id)} disabled={loading} className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-medium">
                        업데이트 반영
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  수동 분석 테스트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={sampleText}
                  onChange={(event) => setSampleText(event.target.value)}
                  className="min-h-[180px]"
                  placeholder="테스트용입니다. 실제 사용은 텔레그램에 대화를 보내면 자동으로 기록됩니다."
                />
                <Button onClick={runAnalysis} disabled={loading || !sampleText.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  분석 실행
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  추출 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {!analysis ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
                    분석 결과가 여기에 표시됩니다.
                  </div>
                ) : (
                  <>
                    <ResultBlock title="요약" items={[analysis.summary]} />
                    <ResultBlock title="할 일" items={analysis.todos?.map((todo: any) => todo.title) || []} />
                    <ResultBlock title="일정 후보" items={analysis.events?.map((event: any) => event.title) || []} />
                    <ResultBlock title="개선점" items={analysis.improvements || []} />
                    <ResultBlock title="위험 신호" items={analysis.risks || []} />
                    <Button onClick={applyAnalysis} disabled={loading || !analysisLogId} className="w-full">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      할 일/일정 반영
                    </Button>
                    <Button onClick={saveAnalysisMemo} disabled={loading || !analysisLogId} variant="outline" className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      분석 결과 메모로 저장
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-slate-700" />
                최근 대화 분석 기록
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                  아직 기록된 대화 분석이 없습니다.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-gray-100 bg-white p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{log.source_type}</Badge>
                      <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('ko-KR')}</span>
                      <span className="text-xs font-medium text-blue-600">{log.status}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{log.summary}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-500 md:grid-cols-3">
                      <p>할 일 {log.todos?.length || 0}건</p>
                      <p>일정 {log.events?.length || 0}건</p>
                      <p>개선점 {log.improvements?.length || 0}건</p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => saveDriveReport(log.id)} disabled={loading}>
                        Drive 리포트 저장
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard icon={<Receipt className="h-5 w-5 text-orange-600" />} title="문자 가계부" body="Android 앱에서 SMS 권한을 받아 카드 승인 문자를 /api/assistant/expenses로 전달하는 구조입니다." />
            <InfoCard icon={<FileAudio className="h-5 w-5 text-rose-600" />} title="통화녹음 분석" body="통화녹음 파일은 Android 앱이 파일 접근 권한을 받은 뒤 Drive 업로드와 분석 대기열로 보냅니다." />
            <InfoCard icon={<CalendarDays className="h-5 w-5 text-blue-600" />} title="캘린더 동기화" body="Google OAuth 연결 뒤 사이트 일정과 Google Calendar를 맞추는 기반입니다." />
          </section>
        </div>
      </div>
    </AuthGuard>
  )
}

function ResultBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-400">없음</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded bg-gray-50 px-3 py-2 text-gray-700">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InfoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <Card className="rounded-lg border-gray-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-gray-500">{body}</p>
    </Card>
  )
}
