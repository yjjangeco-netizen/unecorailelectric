import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// PATCH: 출장/외근 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient()
    const body = await request.json()
    const { id } = params

    console.log('출장/외근 업데이트:', { id, body })

    const { data, error } = await supabase
      .from('business_trips')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('출장/외근 업데이트 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, trip: data })
  } catch (error) {
    console.error('출장/외근 업데이트 중 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET: 출장/외근 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient()
    const { id } = params

    const { data, error } = await supabase
      .from('business_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('출장/외근 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('출장/외근 조회 중 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: 출장/외근 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient()
    const { id } = params

    const { error } = await supabase
      .from('business_trips')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('출장/외근 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('출장/외근 삭제 중 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}



