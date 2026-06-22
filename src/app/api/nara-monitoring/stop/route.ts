import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    // DB 플래그로 중지 (서버리스 메모리 인터벌에 의존하지 않음)
    const { data } = await supabaseServer
      .from('app_settings')
      .select('value')
      .eq('key', 'nara-monitoring')
      .maybeSingle()

    const value = (data?.value || {}) as Record<string, any>

    await supabaseServer
      .from('app_settings')
      .upsert({
        key: 'nara-monitoring',
        value: { ...value, running: false },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    return NextResponse.json({ success: true, message: '모니터링을 중지했습니다.' })
  } catch (error) {
    console.error('NARA monitoring stop error:', error)
    return NextResponse.json({ message: '모니터링 중지에 실패했습니다.' }, { status: 500 })
  }
}
