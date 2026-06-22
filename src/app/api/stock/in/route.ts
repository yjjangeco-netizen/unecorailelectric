import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger, AuditAction } from '@/lib/audit'
import { stockInSchema } from '@/lib/schemas'
import { getApiUser } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return measureAsyncPerformance('재고 입고 처리', async () => {
    try {
      const apiUser = getApiUser(request)

      if (!apiUser) {
        return NextResponse.json(
          { ok: false, error: '유효하지 않은 인증 정보입니다' },
          { status: 401 }
        )
      }

      const user = {
        id: apiUser.userId,
        email: `${apiUser.username}@uneco.com`
      }

      // Supabase 클라이언트 생성
      const supabase = createServerSupabaseClient()

      // 요청 본문 파싱 및 검증
      const body = await request.json()
      const validatedData = stockInSchema.parse(body)
      const receivedBy = validatedData.received_by || apiUser.username || user.id

      const { data: existingItem, error: findError } = await supabase
        .from('items')
        .select('id, closing_quantity, stock_in, stock_out, current_quantity, purpose')
        .eq('name', validatedData.name)
        .eq('specification', validatedData.specification)
        .eq('maker', validatedData.maker || '')
        .eq('location', validatedData.location)
        .eq('stock_status', validatedData.stock_status)
        .maybeSingle()

      if (findError) {
        throw new Error(`품목 조회 실패: ${findError.message}`)
      }

      let itemId: string
      let newQuantity: number
      let previousQuantity = 0

      if (existingItem) {
        previousQuantity =
          (existingItem.closing_quantity || 0) +
          (existingItem.stock_in || 0) -
          (existingItem.stock_out || 0)
        const newStockIn = (existingItem.stock_in || 0) + validatedData.quantity
        newQuantity = (existingItem.closing_quantity || 0) + newStockIn - (existingItem.stock_out || 0)

        const { error: updateError } = await supabase
          .from('items')
          .update({
            stock_in: newStockIn,
            current_quantity: newQuantity,
            total_qunty: newQuantity,
            unit_price: validatedData.unit_price,
            note: validatedData.note,
            purpose: validatedData.reason || existingItem.purpose,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)

        if (updateError) {
          throw new Error(`입고 수량 업데이트 실패: ${updateError.message}`)
        }

        itemId = existingItem.id
      } else {
        newQuantity = validatedData.quantity

        const { data: insertedItem, error: insertError } = await supabase
          .from('items')
          .insert({
            name: validatedData.name,
            specification: validatedData.specification,
            maker: validatedData.maker || '',
            category: '일반',
            location: validatedData.location,
            purpose: validatedData.reason || '재고관리',
            min_stock: 0,
            current_quantity: newQuantity,
            closing_quantity: 0,
            stock_in: validatedData.quantity,
            stock_out: 0,
            disposal_qunty: 0,
            total_qunty: newQuantity,
            unit_price: validatedData.unit_price,
            note: validatedData.note,
            stock_status: validatedData.stock_status,
            status: 'active'
          })
          .select('id')
          .single()

        if (insertError || !insertedItem) {
          throw new Error(`신규 품목 생성 실패: ${insertError?.message || '응답 없음'}`)
        }

        itemId = insertedItem.id
      }

      // 감사 로그 기록
      await serverAuditLogger.logStockOperation(
        AuditAction.STOCK_IN,
        user.id,
        user.email || 'unknown',
        'user',
        'item',
        itemId,
        {
          name: validatedData.name,
          specification: validatedData.specification,
          quantity: validatedData.quantity,
          unit_price: validatedData.unit_price
        }
      )

      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          item_id: itemId,
          event_type: 'IN',
          quantity: validatedData.quantity,
          unit_price: validatedData.unit_price,
          reason: validatedData.reason || '입고',
          received_by: receivedBy,
          notes: validatedData.note || '',
          condition_type: validatedData.stock_status,
          event_date: new Date().toISOString()
        })

      if (historyError) {
        console.error('Failed to log stock history:', historyError)
      }

      return NextResponse.json({
        ok: true,
        data: {
          item_id: itemId,
          name: validatedData.name,
          specification: validatedData.specification,
          quantity: validatedData.quantity,
          unit_price: validatedData.unit_price,
          new_quantity: newQuantity,
          previous_quantity: previousQuantity
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
