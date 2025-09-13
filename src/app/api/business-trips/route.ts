import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabaseServer
      .from('business_trips')
      .select(`
        *,
        business_trip_reports (
          id,
          title,
          content,
          submitted_at,
          status
        )
      `)
      .order('start_date', { ascending: false })

    // 사용자별 필터링
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // 상태별 필터링 (report_status 필드 사용)
    if (status) {
      query = query.eq('report_status', status)
    }

    // 날짜 범위 필터링
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    const { data: trips, error } = await query

    console.log('데이터베이스 쿼리 결과:', { trips, error })
    console.log('쿼리 조건:', { userId, status, startDate, endDate })

    if (error) {
      console.warn('외근/출장 조회 오류:', error)
      return NextResponse.json({ trips: [] })
    }

    // trip_type 필드 추가 (title에 '출장'이 포함되어 있으면 'business', 아니면 'external')
    const tripsWithType = (trips || []).map((trip: any) => ({
      ...trip,
      trip_type: trip.title?.includes('출장') ? 'business' : 'external'
    }))
    
    return NextResponse.json({ trips: tripsWithType })
  } catch (error) {
    console.error('외근/출장 조회 오류:', error)
    return NextResponse.json(
      { error: '외근/출장 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userName, 
      title, 
      purpose, 
      location, 
      startDate, 
      endDate, 
      startTime, 
      endTime 
    } = await request.json()

    // 외근/출장 등록
    const tripType = title?.includes('출장') ? 'business' : 'external'
    
    console.log('출장/외근 등록 요청 데이터:', {
      userId, userName, title, purpose, location, startDate, endDate, startTime, endTime, tripType
    })

    const { data, error } = await supabaseServer
      .from('business_trips')
      .insert({
        user_id: userId,
        user_name: userName,
        title,
        purpose,
        location,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        trip_type: tripType,
        status: 'scheduled',
        report_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()

    console.log('데이터베이스 삽입 결과:', { data, error })

    if (error) {
      console.warn('외근/출장 등록 오류, localStorage에 저장:', error)
      
      // Mock 데이터 생성
      const mockTrip = {
        id: Date.now().toString(),
        user_id: userId,
        user_name: userName,
        title,
        purpose,
        location,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        trip_type: tripType,
        status: 'scheduled',
        report_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // localStorage에 저장하도록 클라이언트에 지시
      return NextResponse.json({
        success: true,
        message: '외근/출장이 성공적으로 등록되었습니다. (localStorage 저장)',
        trip: mockTrip,
        useLocalStorage: true
      })
    }

    return NextResponse.json({
      success: true,
      message: '외근/출장이 성공적으로 등록되었습니다.',
      trip: data[0]
    })
  } catch (error) {
    console.error('외근/출장 등록 오류:', error)
    return NextResponse.json(
      { error: '외근/출장 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, reportStatus } = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (reportStatus) updateData.report_status = reportStatus

    const { data, error } = await supabaseServer
      .from('business_trips')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('외근/출장 업데이트 오류:', error)
      return NextResponse.json(
        { error: '외근/출장 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '외근/출장 정보가 업데이트되었습니다.',
      trip: data[0]
    })
  } catch (error) {
    console.error('외근/출장 업데이트 오류:', error)
    return NextResponse.json(
      { error: '외근/출장 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
