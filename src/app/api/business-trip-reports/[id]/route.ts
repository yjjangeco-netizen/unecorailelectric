import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// GET: 보고서 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await supabaseServer
      .from('business_trip_reports')
      .select(`
        *,
        business_trips (
          id,
          title,
          purpose,
          location,
          start_date,
          end_date,
          start_time,
          end_time,
          user_name,
          user_id,
          trip_type,
          category,
          description,
          status,
          report_status
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('보고서 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('보고서 조회 중 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: 보고서 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 보고서 정보 먼저 조회 (trip_id 확인용)
    const { data: report } = await supabaseServer
      .from('business_trip_reports')
      .select('trip_id')
      .eq('id', id)
      .single()

    // 보고서 삭제
    const { error } = await supabaseServer
      .from('business_trip_reports')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('보고서 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 관련 출장/외근의 report_status를 pending으로 변경
    if (report?.trip_id) {
      await supabaseServer
        .from('business_trips')
        .update({ 
          report_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', report.trip_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('보고서 삭제 중 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH: 보고서 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const { data, error } = await supabaseServer
      .from('business_trip_reports')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('보고서 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, report: data })
  } catch (error) {
    console.error('보고서 수정 중 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


