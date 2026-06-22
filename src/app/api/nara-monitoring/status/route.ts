import { NextRequest, NextResponse } from 'next/server'
import { naraConfigManager } from '@/lib/nara/config'
import { naraMonitoringService } from '@/lib/nara/monitoring'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const status = naraMonitoringService.getStatus()
    const runtimeConfig = naraConfigManager.getAll()
    const config = {
      keywords: runtimeConfig.keywords,
      telegramEnabled: runtimeConfig.enableTelegramNotifications,
      telegramChatId: runtimeConfig.telegramChatId,
      checkInterval: 30
    }

    return NextResponse.json({
      isMonitoring: status.enabled,
      bidItems: naraMonitoringService.getBids(),
      lastCheck: status.lastCheck || new Date().toISOString(),
      errors: status.errors,
      config
    })
  } catch (error) {
    console.error('NARA monitoring status error:', error)
    return NextResponse.json({ message: '상태 확인에 실패했습니다.' }, { status: 500 })
  }
}
