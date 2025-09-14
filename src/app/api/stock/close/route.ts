import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger, AuditAction } from '@/lib/audit'
import { z } from 'zod'

// 마감 요청 스키마
const closingRequestSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  quarter: z.number().int().min(1).max(4).optional(),
  month: z.number().int().min(1).max(12).optional(),
  forceReclose: z.boolean().default(false)
}).refine(data => data.quarter || data.month, {
  message: "분기 또는 월 중 하나는 반드시 지정해야 합니다"
}).refine(data => !(data.quarter && data.month), {
  message: "분기와 월을 동시에 지정할 수 없습니다"
})

// 롤백 요청 스키마
const rollbackRequestSchema = z.object({
  closingRunId: z.string().uuid(),
  reason: z.string().min(1).max(500)
})

// Note: AuthenticatedUser and SupabaseClient types are used implicitly

// 마감 처리 API
export async function POST(request: NextRequest) {
  return measureAsyncPerformance('마감 처리', async () => {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      if (!token) {
        return NextResponse.json(
          { ok: false, error: '인증 토큰이 필요합니다' },
          { status: 401 }
        )
      }

      const supabase = createServerSupabaseClient()
      
      // 토큰으로 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return NextResponse.json(
          { ok: false, error: '인증이 필요합니다' },
          { status: 401 }
        )
      }

      // 관리자 권한 확인 (마감은 관리자만 가능)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('is_admin, department')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile?.is_admin) {
        return NextResponse.json(
          { ok: false, error: '마감 처리는 관리자만 수행할 수 있습니다' },
          { status: 403 }
        )
      }

      // 요청 본문 파싱 및 검증
      const body = await request.json()
      const validatedData = closingRequestSchema.parse(body)

      // 저장 프로시저 호출
      const { data: result, error } = await supabase.rpc('process_closing', {
        p_year: validatedData.year,
        p_quarter: validatedData.quarter || null,
        p_month: validatedData.month || null,
        p_closed_by: user.email || user.id,
        p_force_reclose: validatedData.forceReclose
      })

      if (error) {
        throw new Error(`마감 처리 실패: ${error.message}`)
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
      await serverAuditLogger.logSystemOperation(
        AuditAction.CLOSING_COMPLETE,
        user.id,
        user.email || 'unknown',
        'admin',
        {
          year: validatedData.year,
          quarter: validatedData.quarter,
          month: validatedData.month,
          totalItems: result.total_items,
          totalValue: result.total_value,
          closingRunId: result.closing_run_id
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          closingRunId: result.closing_run_id,
          periodYear: result.period_year,
          periodQuarter: result.period_quarter,
          periodMonth: result.period_month,
          periodType: result.period_type,
          totalItems: result.total_items,
          totalValue: result.total_value,
          completedAt: result.completed_at,
          message: `${result.period_year}년 ${result.period_quarter ? `${result.period_quarter}분기` : `${result.period_month}월`} 마감이 완료되었습니다`
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logError('마감 처리 API 오류', error)
      
      return NextResponse.json(
        { 
          ok: false, 
          error: error instanceof Error ? error.message : '마감 처리 중 오류가 발생했습니다',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  })
}

// 마감 롤백 API
export async function DELETE(request: NextRequest) {
  return measureAsyncPerformance('마감 롤백', async () => {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      if (!token) {
        return NextResponse.json(
          { ok: false, error: '인증 토큰이 필요합니다' },
          { status: 401 }
        )
      }

      const supabase = createServerSupabaseClient()
      
      // 토큰으로 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return NextResponse.json(
          { ok: false, error: '인증이 필요합니다' },
          { status: 401 }
        )
      }

      // 관리자 권한 확인
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile?.is_admin) {
        return NextResponse.json(
          { ok: false, error: '마감 롤백은 관리자만 수행할 수 있습니다' },
          { status: 403 }
        )
      }

      // 요청 본문 파싱 및 검증
      const body = await request.json()
      const validatedData = rollbackRequestSchema.parse(body)

      // 저장 프로시저 호출
      const { data: result, error } = await supabase.rpc('rollback_closing', {
        p_closing_run_id: validatedData.closingRunId,
        p_rollback_by: user.email || user.id,
        p_reason: validatedData.reason
      })

      if (error) {
        throw new Error(`마감 롤백 실패: ${error.message}`)
      }

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
      await serverAuditLogger.logSystemOperation(
        AuditAction.CLOSING_ROLLBACK,
        user.id,
        user.email || 'unknown',
        'admin',
        {
          closingRunId: validatedData.closingRunId,
          rollbackReason: validatedData.reason
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          closingRunId: result.closing_run_id,
          rollbackReason: result.rollback_reason,
          rollbackBy: result.rollback_by,
          rollbackAt: result.rollback_at,
          message: '마감이 성공적으로 롤백되었습니다'
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logError('마감 롤백 API 오류', error)
      
      return NextResponse.json(
        { 
          ok: false, 
          error: error instanceof Error ? error.message : '마감 롤백 중 오류가 발생했습니다',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  })
}

// 마감 이력 조회 API
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
    const { searchParams } = request.nextUrl
    const year = searchParams.get('year')
    const quarter = searchParams.get('quarter')
    const month = searchParams.get('month')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 쿼리 구성
    let query = supabase
      .from('closing_runs')
      .select(`
        *,
        stock_snapshot(count)
      `)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (year) {
      query = query.eq('period_year', parseInt(year))
    }
    if (quarter) {
      query = query.eq('period_quarter', parseInt(quarter))
    }
    if (month) {
      query = query.eq('period_month', parseInt(month))
    }

    const { data: closingRuns, error } = await query

    if (error) {
      throw new Error(`마감 이력 조회 실패: ${error.message}`)
    }

    return NextResponse.json({
      ok: true,
      data: closingRuns,
      pagination: {
        limit,
        offset,
        total: closingRuns.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logError('마감 이력 조회 API 오류', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : '마감 이력 조회 중 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 정적 생성을 위한 설정
export const revalidate = false
