import { supabaseServer } from '@/lib/supabaseServer'

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

/**
 * FCM 푸시 발송 (2단계 — Firebase 서비스계정 설정 시 동작).
 * FCM_SERVICE_ACCOUNT(JSON) 환경변수가 없으면 조용히 건너뛴다.
 */
async function sendPushToUsers(_userIds: string[], _title: string, _body: string, _link?: string) {
  if (!process.env['FCM_SERVICE_ACCOUNT']) return
  // TODO: Firebase Admin / FCM HTTP v1 로 push_tokens 발송 (Firebase 준비 후 연결)
}
