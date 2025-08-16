import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger, AuditAction } from '@/lib/audit'
import { stockInSchema, stockOutSchema, stockAdjustmentSchema, bulkOperationSchema } from '@/lib/schemas'
import type { SupabaseClient } from '@supabase/supabase-js'

// 재고 입고 처리
async function handleStockIn(supabase: SupabaseClient, data: unknown, user: { id: string; email?: string }) {
  try {
    const validatedData = stockInSchema.parse(data)
    
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
      throw error
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
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
      }
    })

  } catch (error) {
    logError('재고 입고 처리 오류', error)
    return NextResponse.json(
      { ok: false, error: '입고 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 재고 출고 처리
async function handleStockOut(supabase: SupabaseClient, data: unknown, user: { id: string; email?: string }) {
  try {
    const validatedData = stockOutSchema.parse(data)
    
    const { data: result, error } = await supabase.rpc('process_stock_out', {
      p_item_id: validatedData.itemId,
      p_quantity: validatedData.quantity,
      p_project: validatedData.project,
      p_notes: validatedData.notes,
      p_is_rental: validatedData.isRental,
      p_issued_by: user.email || user.id
    })

    if (error) {
      throw error
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      )
    }

    // 감사 로그 기록
    await serverAuditLogger.logStockOperation(
      AuditAction.STOCK_OUT,
      user.id,
      user.email || 'unknown',
      'user',
      'item',
      validatedData.itemId,
      {
        quantity: validatedData.quantity,
        project: validatedData.project,
        isRental: validatedData.isRental
      }
    )

    return NextResponse.json({
      ok: true,
      data: {
        itemId: result.item_id,
        itemName: result.item_name,
        quantity: validatedData.quantity,
        previousQuantity: result.previous_quantity,
        newQuantity: result.new_quantity
      }
    })

  } catch (error) {
    logError('재고 출고 처리 오류', error)
    return NextResponse.json(
      { ok: false, error: '출고 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 재고 조정 처리
async function handleStockAdjustment(supabase: SupabaseClient, data: unknown, user: { id: string; email?: string }) {
  try {
    const validatedData = stockAdjustmentSchema.parse(data)
    
    const { data: result, error } = await supabase.rpc('process_stock_adjustment', {
      p_item_id: validatedData.itemId,
      p_adjustment_type: validatedData.adjustmentType,
      p_quantity: validatedData.quantity,
      p_reason: validatedData.reason,
      p_adjusted_by: user.email || user.id
    })

    if (error) {
      throw error
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      )
    }

    // 감사 로그 기록
    await serverAuditLogger.logStockOperation(
      AuditAction.STOCK_ADJUSTMENT,
      user.id,
      user.email || 'unknown',
      'user',
      'item',
      validatedData.itemId,
      {
        adjustmentType: validatedData.adjustmentType,
        quantity: validatedData.quantity,
        reason: validatedData.reason
      }
    )

    return NextResponse.json({
      ok: true,
      data: {
        itemId: result.item_id,
        itemName: result.item_name,
        adjustmentType: validatedData.adjustmentType,
        quantity: validatedData.quantity,
        newQuantity: result.new_quantity
      }
    })

  } catch (error) {
    logError('재고 조정 처리 오류', error)
    return NextResponse.json(
      { ok: false, error: '재고 조정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 대량 작업 처리
async function handleBulkOperation(supabase: SupabaseClient, data: unknown, user: { id: string; email?: string }) {
  try {
    const validatedData = bulkOperationSchema.parse(data)
    
    const { data: result, error } = await supabase.rpc('process_bulk_operations', {
      p_operations: validatedData.operations,
      p_operation_type: validatedData.operationType,
      p_processed_by: user.email || user.id
    })

    if (error) {
      throw error
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result },
        { status: 400 }
      )
    }

    // 감사 로그 기록
    await serverAuditLogger.logStockOperation(
      AuditAction.BULK_STOCK_OPERATION,
      user.id,
      user.email || 'unknown',
      'user',
      'batch',
      result.batch_id,
      {
        operationType: validatedData.operationType,
        totalOperations: result.total_operations,
        successCount: result.success_count,
        errorCount: result.error_count
      }
    )

    return NextResponse.json({
      ok: true,
      data: {
        batchId: result.batch_id,
        totalOperations: result.total_operations,
        successCount: result.success_count,
        errorCount: result.error_count,
        successRate: result.success_rate,
        results: result.results
      }
    })

  } catch (error) {
    logError('대량 작업 처리 오류', error)
    return NextResponse.json(
      { ok: false, error: '대량 작업 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST 요청 처리
export async function POST(request: NextRequest) {
  return measureAsyncPerformance('재고 트랜잭션 처리', async () => {
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

      // 요청 본문 파싱
      const body = await request.json()
      const { action, data: operationData } = body

      // 액션별 처리
      switch (action) {
        case 'stock_in':
          return await handleStockIn(supabase, operationData, user)
        
        case 'stock_out':
          return await handleStockOut(supabase, operationData, user)
        
        case 'stock_adjustment':
          return await handleStockAdjustment(supabase, operationData, user)
        
        case 'bulk_operation':
          return await handleBulkOperation(supabase, operationData, user)
        
        default:
          return NextResponse.json(
            { ok: false, error: '지원하지 않는 액션입니다' },
            { status: 400 }
          )
      }

    } catch (error) {
      logError('재고 트랜잭션 API 오류', error)
      
      return NextResponse.json(
        { 
          ok: false, 
          error: error instanceof Error ? error.message : '재고 트랜잭션 처리 중 오류가 발생했습니다',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  })
}

// GET 요청 처리
export async function GET() {
  return NextResponse.json({ 
    message: '재고 트랜잭션 API',
    endpoints: ['POST'],
    actions: ['stock_in', 'stock_out', 'stock_adjustment', 'bulk_operation']
  })
}
