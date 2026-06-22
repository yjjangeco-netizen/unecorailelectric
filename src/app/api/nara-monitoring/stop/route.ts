import { NextRequest, NextResponse } from 'next/server'
import { naraMonitoringService } from '@/lib/nara/monitoring'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    naraMonitoringService.stop()
    return NextResponse.json({
      success: true,
      message: '모니터링을 중지했습니다.'
    })
  } catch (error) {
    console.error('NARA monitoring stop error:', error)
    return NextResponse.json({ message: '모니터링 중지에 실패했습니다.' }, { status: 500 })
  }
}
