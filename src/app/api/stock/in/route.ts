import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger, AuditAction } from '@/lib/audit'
import { stockInSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return measureAsyncPerformance('재고 입고 처리', async () => {
    try {
      // 임시 토큰 처리 (실제 인증은 클라이언트에서 처리됨)
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      console.log('=== 인증 확인 디버깅 ===')
      console.log('authHeader:', authHeader)
      console.log('token:', token ? '토큰 존재' : '토큰 없음')
      console.log('=== 인증 확인 디버깅 끝 ===')
      
      if (!token) {
        return NextResponse.json(
          { ok: false, error: '인증 토큰이 필요합니다' },
          { status: 401 }
        )
      }

      // 임시 토큰에서 사용자 ID 추출
      const userId = token.startsWith('temp_') ? token.split('_')[1] : null
      
      if (!userId) {
        return NextResponse.json(
          { ok: false, error: '유효하지 않은 토큰입니다' },
          { status: 401 }
        )
      }

      // 임시 사용자 객체 생성
      const user = {
        id: userId,
        email: `${userId}@example.com`
      }

      // Supabase 클라이언트 생성
      const supabase = createServerSupabaseClient()

      // 요청 본문 파싱 및 검증
      const body = await request.json()
      const validatedData = stockInSchema.parse(body)

      // 디버깅: 전송할 데이터 로그
      console.log('=== API 입고 처리 디버깅 ===')
      console.log('전송할 데이터:', {
        p_item_name: validatedData.name,
        p_specification: validatedData.specification,
        p_maker: validatedData.maker,
        p_location: validatedData.location,
        p_quantity: validatedData.quantity,
        p_unit_price: validatedData.unit_price,
        p_stock_status: validatedData.stock_status,
        p_reason: validatedData.reason,
        p_note: validatedData.note,
        p_received_by: user.email || user.id
      })

      // 저장 프로시저 호출
      const { data: result, error } = await supabase.rpc('process_stock_in', {
        p_item_name: validatedData.name,
        p_specification: validatedData.specification,
        p_maker: validatedData.maker,
        p_location: validatedData.location,
        p_quantity: validatedData.quantity,
        p_unit_price: validatedData.unit_price,
        p_stock_status: validatedData.stock_status,
        p_reason: validatedData.reason,
        p_note: validatedData.note,
        p_received_by: user.email || user.id
      })

      // 디버깅: 결과 로그
      console.log('함수 실행 결과:', { result, error })

      if (error) {
        throw new Error(`입고 처리 실패: ${error.message}`)
      }

      // 결과 확인
      if (!result.success) {
        return NextResponse.json(
          { 
            ok: false, 
            error: result.error,
            details: result
          },
          { status: 400 }
        )
      }

      // 감사 로그 기록
      await serverAuditLogger.logStockOperation(
        AuditAction.STOCK_IN,
        user.id,
        user.email || 'unknown',
        'user',
        'item',
        result.item_id,
        {
          name: validatedData.name,
          specification: validatedData.specification,
          quantity: validatedData.quantity,
          unit_price: validatedData.unit_price
        }
      )

      // History Logging (stock_history)
      try {
        const { error: historyError } = await supabase
          .from('stock_history')
          .insert({
            item_id: result.item_id,
            item_name: result.item_name || validatedData.name,
            type: 'in',
            quantity: validatedData.quantity,
            previous_quantity: (result.new_quantity || 0) - validatedData.quantity,
            new_quantity: result.new_quantity,
            reason: validatedData.reason,
            note: validatedData.note,
            location: validatedData.location,
            user_level: '1', // Default to 1 as we don't have level in token yet, or need to fetch user
            created_at: new Date().toISOString()
          })
        
        if (historyError) {
          console.error('Failed to log stock history:', historyError)
        }
      } catch (hErr) {
        console.error('Exception logging history:', hErr)
      }

      return NextResponse.json({
        ok: true,
        data: {
          item_id: result.item_id,
          name: result.item_name,
          specification: result.item_specification,
          quantity: validatedData.quantity,
          unit_price: validatedData.unit_price,
          new_quantity: result.new_quantity,
          weighted_avg_price: result.weighted_avg_price
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logError('재고 입고 API 오류', error)
      
      return NextResponse.json(
        { 
          ok: false, 
          error: error instanceof Error ? error.message : '입고 처리 중 오류가 발생했습니다',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  })
}

export async function GET() {
  return NextResponse.json({ 
    message: '재고 입고 API',
    endpoints: ['POST'],
    requiredFields: ['name', 'specification', 'maker', 'location', 'quantity', 'unit_price', 'stock_status', 'reason', 'note']
  })
}
