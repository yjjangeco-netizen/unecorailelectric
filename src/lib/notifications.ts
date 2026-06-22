import { supabaseServer } from '@/lib/supabaseServer'
import jwt from 'jsonwebtoken'

export type NotificationType = 'event_created' | 'work_report_submitted' | 'report_approved'

/**
 * 대상 사용자들에게 알림을 생성한다.
 * - 사용자별 notification_settings 를 확인해 전체 off / 해당 유형 off 는 제외
 * - (2단계) push_tokens 로 FCM 발송은 추후 연결
 */
export async function createNotifications(params: {
  userIds: string[]
  type: NotificationType
  title: string
  body?: string
  link?: string
  excludeUserId?: string
}) {
  try {
    const targets = Array.from(new Set(params.userIds))
      .filter((id) => id && id !== params.excludeUserId)
    if (targets.length === 0) return

    const { data: settings } = await supabaseServer
      .from('notification_settings')
      .select('user_id, enabled, event_created, work_report_submitted, report_approved')
      .in('user_id', targets)

    const settingMap = new Map((settings || []).map((s: any) => [s.user_id, s]))
    const allowed = targets.filter((id) => {
      const s: any = settingMap.get(id)
      if (!s) return true // 설정 없으면 기본 수신
      if (!s.enabled) return false
      return s[params.type] !== false
    })
    if (allowed.length === 0) return

    const rows = allowed.map((uid) => ({
      user_id: uid,
      type: params.type,
      title: params.title,
      body: params.body || null,
      link: params.link || null
    }))

    await supabaseServer.from('notifications').insert(rows)
    await sendPushToUsers(allowed, params.title, params.body || '', params.link)
  } catch (error) {
    // 알림 실패가 본 기능을 막지 않도록 무시
    console.warn('createNotifications failed:', error)
  }
}

/** 관리자(레벨5/admin) 사용자 id 목록 */
export async function getApproverUserIds(): Promise<string[]> {
  const { data } = await supabaseServer
    .from('users')
    .select('id, level, username')
    .eq('is_active', true)
  return (data || [])
    .filter((u: any) => ['5', 'admin', 'administrator'].includes(String(u.level || '').toLowerCase()) || u.username === 'admin')
    .map((u: any) => u.id)
}

/** 전체 활성 사용자 id 목록 */
export async function getAllActiveUserIds(): Promise<string[]> {
  const { data } = await supabaseServer
    .from('users')
    .select('id')
    .eq('is_active', true)
  return (data || []).map((u: any) => u.id)
}

let cachedToken: { token: string; exp: number } | null = null

/** 서비스계정으로 Google OAuth 액세스 토큰 발급 (FCM 발송용) */
async function getFcmAccessToken(sa: any): Promise<string | null> {
  if (cachedToken && cachedToken.exp > Date.now() + 60000) return cachedToken.token
  try {
    const now = Math.floor(Date.now() / 1000)
    const assertion = jwt.sign(
      {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
      },
      sa.private_key,
      { algorithm: 'RS256' }
    )
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`
    })
    const data = await res.json()
    if (!data.access_token) return null
    cachedToken = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 }
    return data.access_token
  } catch (e) {
    console.warn('FCM access token 발급 실패:', e)
    return null
  }
}

/**
 * FCM HTTP v1 으로 푸시 발송. FCM_SERVICE_ACCOUNT(JSON) 미설정 시 건너뜀.
 */
async function sendPushToUsers(userIds: string[], title: string, body: string, link?: string) {
  const raw = process.env['FCM_SERVICE_ACCOUNT']
  if (!raw || userIds.length === 0) return
  try {
    const sa = JSON.parse(raw)
    const accessToken = await getFcmAccessToken(sa)
    if (!accessToken) return

    const { data: tokens } = await supabaseServer
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)
    if (!tokens || tokens.length === 0) return

    const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
    await Promise.all(
      tokens.map((t: any) =>
        fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: { title, body },
              data: link ? { link } : {},
              android: { priority: 'HIGH' }
            }
          })
        }).catch(() => null)
      )
    )
  } catch (e) {
    console.warn('FCM 발송 실패:', e)
  }
}
