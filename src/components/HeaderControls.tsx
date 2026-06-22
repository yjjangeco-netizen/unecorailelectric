'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Menu, UserCog, BellRing, LogOut, X, Check } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface NotificationItem {
  id: string
  type: string
  title: string
  body?: string
  link?: string
  is_read: boolean
  created_at: string
}

interface NotiSettings {
  enabled: boolean
  event_created: boolean
  work_report_submitted: boolean
  report_approved: boolean
}

export default function HeaderControls() {
  const { user, logout } = useUser()
  const router = useRouter()

  const [bellOpen, setBellOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {
      // 무시
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [user?.id, load])

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setBellOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openNotification = async (n: NotificationItem) => {
    try {
      await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ id: n.id }) })
    } catch {}
    setBellOpen(false)
    await load()
    if (n.link) router.push(n.link)
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ all: true }) })
    } catch {}
    await load()
  }

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1">
      {/* 종 */}
      <button
        onClick={() => { setBellOpen((v) => !v); setMenuOpen(false) }}
        className="relative p-1.5 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
        title="알림"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* 삼선 */}
      <button
        onClick={() => { setMenuOpen((v) => !v); setBellOpen(false) }}
        className="p-1.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
        title="메뉴"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 알림 드롭다운 */}
      {bellOpen && (
        <div className="absolute right-0 top-11 z-[200] w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-bold text-gray-900">알림</span>
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">모두 읽음</button>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">새 알림이 없습니다.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 ${n.is_read ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* 삼선 메뉴 */}
      {menuOpen && (
        <div className="absolute right-0 top-11 z-[200] w-52 rounded-xl border border-gray-200 bg-white shadow-2xl py-1">
          <button
            onClick={() => { setMenuOpen(false); setProfileOpen(true) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <UserCog className="w-4 h-4" /> 내 정보 수정
          </button>
          <button
            onClick={() => { setMenuOpen(false); setSettingsOpen(true) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <BellRing className="w-4 h-4" /> 알람 설정
          </button>
          <div className="my-1 border-t" />
          <button
            onClick={() => { setMenuOpen(false); logout() }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      )}

      {settingsOpen && <AlarmSettingsModal onClose={() => setSettingsOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}

function AlarmSettingsModal({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<NotiSettings>({ enabled: true, event_created: true, work_report_submitted: true, report_approved: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.settings) setS(d.settings) })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    await fetch('/api/notifications/settings', { method: 'PUT', body: JSON.stringify(s) })
    onClose()
  }

  const Row = ({ k, label }: { k: keyof NotiSettings; label: string }) => (
    <label className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-800">{label}</span>
      <input type="checkbox" checked={s[k]} disabled={k !== 'enabled' && !s.enabled}
        onChange={(e) => setS((p) => ({ ...p, [k]: e.target.checked }))} className="w-5 h-5" />
    </label>
  )

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">알람 설정</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <div className="divide-y">
            <Row k="enabled" label="알림 받기 (전체)" />
            <Row k="event_created" label="새 일정 등록" />
            <Row k="work_report_submitted" label="업무일지 등록" />
            <Row k="report_approved" label="보고서 승인" />
          </div>
        )}
        <button onClick={save} className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Check className="inline w-4 h-4 mr-1" /> 저장
        </button>
      </div>
    </div>
  )
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useUser()
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.home_address || '')
  const [pw, setPw] = useState('')
  const [status, setStatus] = useState('')

  const save = async () => {
    setStatus('저장 중...')
    try {
      const payload: any = { id: user?.id, phone, home_address: address }
      if (pw) payload.password = pw
      const res = await fetch('/api/users', { method: 'PUT', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      setStatus('저장되었습니다.')
      setTimeout(onClose, 800)
    } catch {
      setStatus('저장에 실패했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">내 정보 수정</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input value={user?.name || ''} disabled className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">전화번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">집주소</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">새 비밀번호 (변경 시에만)</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="변경하려면 입력" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        {status && <p className="mt-2 text-xs text-gray-500">{status}</p>}
        <button onClick={save} className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">저장</button>
      </div>
    </div>
  )
}
