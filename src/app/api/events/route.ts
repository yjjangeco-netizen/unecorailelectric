import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// RLS 우회를 위한 anon 키 사용
const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const createApiClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function GET(request: NextRequest) {
  try {
    console.log('이벤트 API GET 요청 시작')
    const userLevel = request.headers.get('x-user-level') || '1'
    const userId = request.headers.get('x-user-id')
    
    console.log('헤더 정보:', { userLevel, userId })
    
    const supabase = createApiClient()
    
    // RLS 우회를 위해 모든 데이터 조회
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
    
    console.log('Supabase 쿼리 결과:', { data, error })
    
    if (error) {
      console.error('이벤트 조회 오류:', error)
      return NextResponse.json({ error: '이벤트 조회 실패' }, { status: 500 })
    }
    
    console.log('이벤트 API 응답 데이터:', data)
    return NextResponse.json(data || [])
    
  } catch (error) {
    console.error('이벤트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('이벤트 생성 요청 데이터:', body)
    const userLevel = request.headers.get('x-user-level') || '1'
    
    const {
      category,
      subCategory,
      subSubCategory,
      projectType,
      projectId,
      customProject,
      summary,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      participantId,
      participantName,
      participantLevel,
      companions,
      createdById,
      createdByName,
      createdByLevel
    } = body
    
    console.log('필수 필드 체크:', { category, summary, startDate, endDate, participantId })
    
    if (!category || !summary || !startDate || !endDate || !participantId) {
      console.log('필수 필드 누락:', { category, summary, startDate, endDate, participantId })
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }
    
    const supabase = createApiClient()
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        category,
        sub_category: subCategory,
        sub_sub_category: subSubCategory,
        project_type: projectType,
        project_id: projectId,
        custom_project: customProject,
        summary,
        description: description || null,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location: location || null,
        participant_id: participantId,
        participant_name: participantName,
        participant_level: participantLevel || '1',
        companions: companions || [],
        created_by_id: createdById || participantId,
        created_by_name: createdByName || participantName,
        created_by_level: createdByLevel || '1'
      })
      .select()
      .single()
    
    if (error) {
      console.error('이벤트 생성 오류:', error)
      console.error('오류 상세:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: `이벤트 생성 실패: ${error.message}` }, { status: 500 })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('이벤트 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
