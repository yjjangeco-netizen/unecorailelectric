import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const tripId = searchParams.get('tripId')
    const userId = searchParams.get('userId')

    let query = supabaseServer
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
          user_name
        )
      `)
      .order('submitted_at', { ascending: false })

    if (tripId) {
      query = query.eq('trip_id', tripId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('보고서 조회 오류:', error)
      return NextResponse.json(
        { error: '보고서를 가져오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('보고서 조회 오류:', error)
    return NextResponse.json(
      { error: '보고서를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      tripId, 
      userId, 
      userName, 
      title, 
      content, 
      attachments = [] 
    } = await request.json()

    // 보고서 작성
    const { data, error } = await supabaseServer
      .from('business_trip_reports')
      .insert({
        trip_id: tripId,
        user_id: userId,
        user_name: userName,
        title,
        content,
        attachments,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('보고서 작성 오류:', error)
      return NextResponse.json(
        { error: '보고서 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 외근/출장 상태를 보고 완료로 업데이트
    await supabaseServer
      .from('business_trips')
      .update({ 
        report_status: 'submitted',
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId)

    return NextResponse.json({
      success: true,
      message: '보고서가 성공적으로 작성되었습니다.',
      report: data[0]
    })
  } catch (error) {
    console.error('보고서 작성 오류:', error)
    return NextResponse.json(
      { error: '보고서 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, approvedBy, title, content, rejectReason } = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // 제목/내용 수정
    if (title) updateData.title = title
    if (content) updateData.content = content

    if (status) {
      updateData.status = status
      if (status === 'approved') {
        updateData.approved_by = approvedBy
        updateData.approved_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabaseServer
      .from('business_trip_reports')
      .update(updateData)
      .eq('id', id)
      .select('*, trip_id')

    if (error) {
      console.error('보고서 업데이트 오류:', error)
      return NextResponse.json(
        { error: '보고서 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 보고서 상태에 따라 business_trips의 report_status도 업데이트
    if (data && data[0]?.trip_id && status) {
      let tripReportStatus = 'submitted'
      
      if (status === 'rejected') {
        // 반려되면 다시 보고해야 하므로 pending으로 변경
        tripReportStatus = 'rejected'
      } else if (status === 'approved') {
        tripReportStatus = 'approved'
      } else if (status === 'submitted') {
        tripReportStatus = 'submitted'
      }

      await supabaseServer
        .from('business_trips')
        .update({ 
          report_status: tripReportStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', data[0].trip_id)
    }

    return NextResponse.json({
      success: true,
      message: '보고서가 업데이트되었습니다.',
      report: data?.[0]
    })
  } catch (error) {
    console.error('보고서 업데이트 오류:', error)
    return NextResponse.json(
      { error: '보고서 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
