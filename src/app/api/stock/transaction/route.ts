import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { validateStockIn, validateStockOut } from '@/lib/schemas'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger } from '@/lib/audit'
import { AuditAction } from '@/lib/audit'

interface AuthenticatedUser {
  id: string
  email?: string
  role?: string
}

type SupabaseClient = ReturnType<typeof createServerSupabaseClient>

// 트랜잭션 기반 재고 갱신 API
export async function POST(request: NextRequest) {
  return measureAsyncPerformance('재고 트랜잭션 처리', async () => {
    try {
      const supabase = createServerSupabaseClient()
      
      // 요청 본문 파싱
      const body = await request.json()
      const { action, data } = body

      // 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { ok: false, error: '인증이 필요합니다' },
          { status: 401 }
        )
      }

      // 액션별 처리
      switch (action) {
        case 'stock_in':
          return await handleStockIn(supabase, data, user)
        case 'stock_out':
          return await handleStockOut(supabase, data, user)
        case 'stock_adjustment':
          return await handleStockAdjustment(supabase, data, user)
        case 'bulk_operation':
          return await handleBulkOperation(supabase, data, user)
        default:
          return NextResponse.json(
            { ok: false, error: '지원하지 않는 액션입니다' },
            { status: 400 }
          )
      }
    } catch (error) {
      logError('재고 트랜잭션 API 오류', error, { body: await request.text() })
      
      return NextResponse.json(
        { 
          ok: false, 
          error: error instanceof Error ? error.message : '재고 처리 중 오류가 발생했습니다',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  })
}

// 입고 처리 (트랜잭션)
async function handleStockIn(supabase: SupabaseClient, data: unknown, user: AuthenticatedUser) {
  // 입력 데이터 검증
  const validatedData = validateStockIn(data)
  
  // 트랜잭션 시작
  const { data: result, error } = await supabase.rpc('process_stock_in', {
    p_item_name: validatedData.itemName,
    p_quantity: validatedData.quantity,
    p_unit_price: validatedData.unitPrice,
    p_condition_type: validatedData.conditionType,
    p_reason: validatedData.reason,
    p_ordered_by: validatedData.orderedBy,
    p_received_by: user.email || user.id,
    p_notes: validatedData.notes
  })

  if (error) {
    throw new Error(`입고 처리 실패: ${error.message}`)
  }

        // 감사 로그 기록
      await serverAuditLogger.logStockOperation(
        AuditAction.STOCK_IN,
        user.id,
        user.email || 'unknown',
        'admin', // TODO: get actual user role
        'stock_in',
        validatedData.itemName, // itemName 사용
        {
          quantity: validatedData.quantity,
          unit_price: validatedData.unitPrice,
          condition_type: validatedData.conditionType,
          reason: validatedData.reason,
          ordered_by: validatedData.orderedBy,
          transaction_id: result.transaction_id
        }
      )

  return NextResponse.json({
    ok: true,
    data: {
      message: `${validatedData.itemName} 입고 완료 (수량: ${validatedData.quantity}개)`,
      transactionId: result.transaction_id,
      itemId: result.item_id,
      newQuantity: result.new_quantity
    },
    timestamp: new Date().toISOString()
  })
}

// 출고 처리 (트랜잭션)
async function handleStockOut(supabase: SupabaseClient, data: unknown, user: AuthenticatedUser) {
  // 입력 데이터 검증
  const validatedData = validateStockOut(data)
  
  // 재고 확인
  const { data: currentStock, error: stockError } = await supabase
    .from('current_stock')
    .select('current_quantity, unit_price')
    .eq('id', validatedData.itemId)
    .single()

  if (stockError || !currentStock) {
    throw new Error('재고 정보를 찾을 수 없습니다')
  }

  if (currentStock.current_quantity < validatedData.quantity) {
    throw new Error(`재고 부족: 현재 ${currentStock.current_quantity}개, 요청 ${validatedData.quantity}개`)
  }

  // 트랜잭션 처리
  const { data: result, error } = await supabase.rpc('process_stock_out', {
    p_item_id: validatedData.itemId,
    p_quantity: validatedData.quantity,
    p_project: validatedData.project,
    p_is_rental: validatedData.isRental,
    p_return_date: validatedData.returnDate,
    p_issued_by: user.email || user.id,
    p_notes: validatedData.notes
  })

  if (error) {
    throw new Error(`출고 처리 실패: ${error.message}`)
  }

        // 감사 로그 기록
      await serverAuditLogger.logStockOperation(
        AuditAction.STOCK_OUT,
        user.id,
        user.email || 'unknown',
        'admin', // TODO: get actual user role
        'stock_out',
        validatedData.itemId,
        {
          quantity: validatedData.quantity,
          project: validatedData.project,
          is_rental: validatedData.isRental,
          rental_flag: validatedData.isRental,
          transaction_id: result.transaction_id
        }
      )

  return NextResponse.json({
    ok: true,
    data: {
      message: `출고 완료 (수량: ${validatedData.quantity}개)`,
      transactionId: result.transaction_id,
      remainingQuantity: result.remaining_quantity
    },
    timestamp: new Date().toISOString()
  })
}

// 재고 조정 처리 (트랜잭션)
async function handleStockAdjustment(supabase: SupabaseClient, data: unknown, user: AuthenticatedUser) {
  // 타입 가드로 데이터 검증
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid adjustment data')
  }
  
  const adjustmentData = data as {
    itemId: string
    adjustedQuantity: number
    adjustmentReason: string
    notes?: string
  }
  
  const { itemId, adjustedQuantity, adjustmentReason, notes } = adjustmentData

  // 권한 확인 (관리자/매니저만)
  const { data: userRole } = await supabase
    .from('users')
    .select('role, department')
    .eq('id', user.id)
    .single()

  if (!userRole || (userRole.role !== 'admin' && userRole.department !== '전기팀')) {
    return NextResponse.json(
      { ok: false, error: '재고 조정 권한이 없습니다' },
      { status: 403 }
    )
  }

  // 트랜잭션 처리
  const { data: result, error } = await supabase.rpc('process_stock_adjustment', {
    p_item_id: itemId,
    p_adjusted_quantity: adjustedQuantity,
    p_adjustment_reason: adjustmentReason,
    p_adjusted_by: user.id,
    p_notes: notes
  })

  if (error) {
    throw new Error(`재고 조정 실패: ${error.message}`)
  }

  // 감사 로그 기록
  await serverAuditLogger.logStockOperation(
    AuditAction.STOCK_ADJUSTMENT,
    user.id,
    user.email || 'unknown',
    'admin', // TODO: get actual user role
    'stock_adjustment',
    itemId,
    {
      old_quantity: result.old_quantity,
      new_quantity: adjustedQuantity,
      adjustment_reason: adjustmentReason,
      transaction_id: result.transaction_id
    }
  )

  return NextResponse.json({
    ok: true,
    data: {
      message: `재고 조정 완료: ${result.old_quantity} → ${adjustedQuantity}`,
      transactionId: result.transaction_id,
      oldQuantity: result.old_quantity,
      newQuantity: adjustedQuantity
    },
    timestamp: new Date().toISOString()
  })
}

interface BulkOperationData {
  operations: unknown[]
  operationType: string
}

// 대량 작업 처리 (트랜잭션)
async function handleBulkOperation(supabase: SupabaseClient, data: BulkOperationData, user: AuthenticatedUser) {
  const { operations, operationType } = data

  if (!Array.isArray(operations) || operations.length === 0) {
    return NextResponse.json(
      { ok: false, error: '유효한 작업 목록이 필요합니다' },
      { status: 400 }
    )
  }

  // 대량 작업은 최대 100개로 제한
  if (operations.length > 100) {
    return NextResponse.json(
      { ok: false, error: '한 번에 최대 100개 작업만 가능합니다' },
      { status: 400 }
    )
  }

  // 트랜잭션 처리
  const { data: result, error } = await supabase.rpc('process_bulk_stock_operation', {
    p_operations: operations,
    p_operation_type: operationType,
    p_processed_by: user.id
  })

  if (error) {
    throw new Error(`대량 작업 처리 실패: ${error.message}`)
  }

  // 감사 로그 기록
  await serverAuditLogger.logSystemOperation(
    AuditAction.SYSTEM_MAINTENANCE,
    user.id,
    user.email || 'unknown',
    'admin', // TODO: get actual user role
    {
      operation_type: operationType,
      total_operations: operations.length,
      successful_operations: result.successful_count,
      failed_operations: result.failed_count,
      batch_id: result.batch_id
    }
  )

  return NextResponse.json({
    ok: true,
    data: {
      message: `대량 작업 완료: ${result.successful_count}개 성공, ${result.failed_count}개 실패`,
      batchId: result.batch_id,
      successfulCount: result.successful_count,
      failedCount: result.failed_count,
      details: result.details
    },
    timestamp: new Date().toISOString()
  })
}

// GET 요청: 트랜잭션 이력 조회
export async function GET(request: NextRequest) {
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

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const transactionType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 쿼리 구성
    let query = supabase
      .from('stock_transactions')
      .select(`
        *,
        items(name, specification),
        users(email, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`트랜잭션 이력 조회 오류: ${error.message}`)
    }

    return NextResponse.json({
      ok: true,
      data,
      pagination: {
        limit,
        offset,
        total: data.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logError('트랜잭션 이력 조회 API 오류', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : '트랜잭션 이력 조회 중 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
