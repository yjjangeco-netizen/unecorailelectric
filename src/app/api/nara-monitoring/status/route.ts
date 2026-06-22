import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 서버리스에서는 메모리 setInterval 이 유지되지 않으므로,
// 모니터링 상태는 app_settings('nara-monitoring').running 플래그로 판단한다.
export async function GET(_request: NextRequest) {
  try {
    const { data } = await supabaseServer
      .from('app_settings')
      .select('value')
      .eq('key', 'nara-monitoring')
      .maybeSingle()

    const value = (data?.value || {}) as Record<string, any>

    return NextResponse.json({
      isMonitoring: value.running === true,
      bidItems: [],
      lastCheck: value.lastCheck || null,
      errors: [],
      config: {
        keywords: Array.isArray(value.keywords) ? value.keywords : [],
        telegramEnabled: Boolean(value.telegramEnabled),
        telegramChatId: value.telegramChatId || '',
        checkInterval: Number(value.checkInterval) || 30
      }
    })
  } catch (error) {
    console.error('NARA monitoring status error:', error)
    return NextResponse.json({ message: '상태 확인에 실패했습니다.' }, { status: 500 })
  }
}
