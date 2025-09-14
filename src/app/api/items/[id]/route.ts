import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have multiple cookies being set during a single request.
            }
          },
          remove(name: string) {
            try {
              cookieStore.delete(name)
            } catch {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have multiple cookies being set during a single request.
            }
          },
        },
      }
    )

    const itemId = params.id
    const updates = await request.json()

    console.log('품목 수정 요청:', { itemId, updates })

    // 업데이트할 필드 검증 (수정 모드에서 필요한 필드들 추가)
    const allowedFields = ['stock_status', 'location', 'closing_quantity', 'product', 'spec', 'maker', 'unit_price', 'purpose', 'note']
    const validUpdates: any = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field]
      }
    }

    // updated_at 필드 추가
    validUpdates.updated_at = new Date().toISOString()

    // 품목 업데이트
    const { data, error } = await supabase
      .from('items')
      .update(validUpdates)
      .eq('id', itemId)
      .select()

    if (error) {
      console.error('품목 업데이트 오류:', error)
      return NextResponse.json({ 
        error: '품목 수정에 실패했습니다.',
        details: error.message 
      }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: '해당 품목을 찾을 수 없습니다.' 
      }, { status: 404 })
    }

    console.log('품목 수정 완료:', data[0])

    return NextResponse.json({ 
      success: true, 
      message: '품목이 성공적으로 수정되었습니다.',
      item: data[0]
    })

  } catch (error) {
    console.error('품목 수정 API 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
