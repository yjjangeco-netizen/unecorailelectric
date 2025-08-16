import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger, AuditAction } from '@/lib/audit'
import { stockInSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  return measureAsyncPerformance('재고 입고 처리', async () => {
    try {
      const supabase = createServerSupabaseClient()
      
      // 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { ok: false, error: '인증이 필요합니다' },
          { status: 401 }
        )
      }

      // 요청 본문 파싱 및 검증
      const body = await request.json()
      const validatedData = stockInSchema.parse(body)

      // 저장 프로시저 호출
      const { data: result, error } = await supabase.rpc('process_stock_in', {
        p_item_name: validatedData.itemName,
        p_quantity: validatedData.quantity,
        p_unit_price: validatedData.unitPrice,
        p_condition_type: validatedData.conditionType,
        p_reason: validatedData.reason,
        p_ordered_by: validatedData.orderedBy,
        p_notes: validatedData.notes,
        p_added_by: user.email || user.id
      })

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
          itemName: validatedData.itemName,
          quantity: validatedData.quantity,
          unitPrice: validatedData.unitPrice
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          itemId: result.item_id,
          itemName: result.item_name,
          quantity: validatedData.quantity,
          unitPrice: validatedData.unitPrice,
          newQuantity: result.new_quantity,
          weightedAvgPrice: result.weighted_avg_price
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
    requiredFields: ['itemName', 'quantity', 'unitPrice', 'conditionType', 'reason', 'orderedBy']
  })
}
