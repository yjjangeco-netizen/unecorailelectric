import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { logError, measureAsyncPerformance } from '@/lib/utils'
import { serverAuditLogger, AuditAction } from '@/lib/audit'
import { z } from 'zod'
import { getApiUser } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// Schema for disposal request
const disposalItemSchema = z.object({
    id: z.string(),
    quantity: z.number().min(1),
    reason: z.string().min(1)
})

const disposalRequestSchema = z.object({
    items: z.array(disposalItemSchema)
})

export async function POST(request: NextRequest) {
    return measureAsyncPerformance('재고 폐기 처리', async () => {
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

            const supabase = createServerSupabaseClient()
            const body = await request.json()
            const validatedData = disposalRequestSchema.parse(body)

            const results = []
            const errors = []

            for (const item of validatedData.items) {
                try {
                    // 1. Get current stock
                    const { data: currentItem, error: fetchError } = await supabase
                        .from('items')
                        .select('name, current_quantity, disposal_qunty, specification')
                        .eq('id', item.id)
                        .single()

                    if (fetchError || !currentItem) {
                        throw new Error(`Item not found: ${item.id}`)
                    }

                    if (currentItem.current_quantity < item.quantity) {
                        throw new Error(`Insufficient stock for ${currentItem.name}. Current: ${currentItem.current_quantity}, Requested: ${item.quantity}`)
                    }

                    // 2. Update stock
                    const newQuantity = currentItem.current_quantity - item.quantity
                    const { error: updateError } = await supabase
                        .from('items')
                        .update({
                            current_quantity: newQuantity,
                            total_qunty: newQuantity,
                            disposal_qunty: (currentItem.disposal_qunty || 0) + item.quantity,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.id)

                    if (updateError) {
                        throw new Error(`Failed to update stock for ${currentItem.name}: ${updateError.message}`)
                    }

                    const { error: historyError } = await supabase
                        .from('stock_history')
                        .insert({
                            item_id: item.id,
                            event_type: 'DISPOSAL',
                            quantity: item.quantity,
                            disposal_reason: item.reason,
                            requester: apiUser.username,
                            reason: item.reason,
                            event_date: new Date().toISOString()
                        })

                    if (historyError) {
                        throw new Error(`Failed to log disposal history for ${currentItem.name}: ${historyError.message}`)
                    }

                    // 4. Audit log
                    await serverAuditLogger.logStockOperation(
                        AuditAction.STOCK_OUT, // Use STOCK_OUT for disposal for now, or add DISPOSAL to AuditAction
                        user.id,
                        user.email || 'unknown',
                        'user',
                        'item',
                        item.id,
                        {
                            name: currentItem.name,
                            specification: currentItem.specification,
                            quantity: item.quantity,
                            reason: item.reason,
                            type: 'DISPOSAL'
                        }
                    )

                    results.push({
                        id: item.id,
                        name: currentItem.name,
                        disposed_quantity: item.quantity,
                        remaining_quantity: newQuantity
                    })

                } catch (err: any) {
                    errors.push({
                        id: item.id,
                        error: err.message
                    })
                }
            }

            if (errors.length > 0 && results.length === 0) {
                return NextResponse.json(
                    { ok: false, error: 'All disposal requests failed', details: errors },
                    { status: 400 }
                )
            }

            return NextResponse.json({
                ok: true,
                data: {
                    results,
                    errors: errors.length > 0 ? errors : undefined
                },
                timestamp: new Date().toISOString()
            })

        } catch (error) {
            logError('재고 폐기 API 오류', error)
            return NextResponse.json(
                {
                    ok: false,
                    error: error instanceof Error ? error.message : '폐기 처리 중 오류가 발생했습니다',
                    timestamp: new Date().toISOString()
                },
                { status: 500 }
            )
        }
    })
}
