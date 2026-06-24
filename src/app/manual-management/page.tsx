'use client'

import { useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link as LinkIcon } from 'lucide-react'

// 매뉴얼 동기화 전용 페이지 — 구글 드라이브 폴더 → 챗봇 의미검색 색인.
// (옛 매뉴얼/알람 콘텐츠 게시판은 /chatbot-admin 통합 관리자로 이전됨)
export default function ManualManagementPage() {
  const { user } = useUser()
  const userId = user?.id || user?.username || ''
  const requestHeaders = useMemo(
    () => (userId ? { 'x-user-id': String(userId) } : undefined),
    [userId]
  )

  const [syncFolder, setSyncFolder] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const connectGoogle = async () => {
    if (!userId) return
    setSyncMsg('')
    try {
      const res = await fetch('/api/assistant/google/connect', { headers: requestHeaders })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Google 연결 준비에 실패했습니다.')
      window.location.href = data.url
    } catch (e) {
      setSyncMsg('' + (e instanceof Error ? e.message : 'Google 연결에 실패했습니다.'))
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
      setSyncMsg(`${data.message || '동기화 완료'}`)
    } catch (e) {
      setSyncMsg(`${e instanceof Error ? e.message : '동기화에 실패했습니다.'}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AuthGuard requiredLevel={4}>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">매뉴얼 동기화</h1>
          <p className="mt-1 text-sm text-gray-600">
            매뉴얼이 담긴 구글 드라이브 폴더를 챗봇 의미검색에 연결합니다.
          </p>

          <Card className="mt-5 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">챗봇 매뉴얼 동기화 (구글 드라이브 · 의미검색)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                구글 드라이브 폴더 링크를 붙여넣고 동기화하면, 파일을 읽어 요약·검색어를 만들고
                의미검색용으로 색인해 QR 챗봇 답변에 연결합니다. 이미지 PDF는 자동 OCR합니다. 파일이
                많으면 끝날 때까지 여러 번 눌러주세요.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={syncFolder}
                  onChange={(e) => setSyncFolder(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <Button onClick={handleManualSync} disabled={syncing} className="bg-blue-600 text-white hover:bg-blue-700">
                  {syncing ? '동기화 중...' : '매뉴얼 동기화'}
                </Button>
              </div>
              {syncMsg && <p className="text-sm text-gray-700">{syncMsg}</p>}
              <p className="text-xs text-gray-500">
                동기화에서 &quot;Token expired/revoked&quot; 오류가 나면 드라이브 연결이 만료된 것입니다.{' '}
                <button onClick={connectGoogle} className="inline-flex items-center font-medium text-blue-600 underline">
                  <LinkIcon className="mr-1 h-3 w-3" /> Google 재연결
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
