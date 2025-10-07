import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

// 프로젝트의 모터 사양 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    const { data, error } = await supabase
      .from('project_motors')
      .select('*')
      .eq('project_id', projectId)
      .order('motor_type', { ascending: true })

    if (error) {
      console.error('모터 사양 조회 오류:', error)
      return NextResponse.json({ error: '모터 사양 조회 실패' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('모터 사양 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// 모터 사양 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const motorData = await request.json()

    const { data, error } = await supabase
      .from('project_motors')
      .insert({
        project_id: projectId,
        motor_type: motorData.motor_type,
        motor_name: motorData.motor_name,
        power_kw: motorData.power_kw,
        voltage: motorData.voltage,
        phase: motorData.phase,
        pole: motorData.pole,
        current_amp: motorData.current_amp,
        quantity: motorData.quantity,
        breaker_size: motorData.breaker_size,
        cable_size: motorData.cable_size,
        eocr_setting: motorData.eocr_setting,
        breaker_setting: motorData.breaker_setting
      })
      .select()
      .single()

    if (error) {
      console.error('모터 사양 추가 오류:', error)
      return NextResponse.json({ error: '모터 사양 추가 실패' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('모터 사양 추가 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// 모터 사양 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const motorId = searchParams.get('motorId')
    
    if (!motorId) {
      return NextResponse.json({ error: 'Motor ID is required' }, { status: 400 })
    }

    const motorData = await request.json()

    const { data, error } = await supabase
      .from('project_motors')
      .update({
        motor_type: motorData.motor_type,
        motor_name: motorData.motor_name,
        power_kw: motorData.power_kw,
        voltage: motorData.voltage,
        phase: motorData.phase,
        pole: motorData.pole,
        current_amp: motorData.current_amp,
        quantity: motorData.quantity,
        breaker_size: motorData.breaker_size,
        cable_size: motorData.cable_size,
        eocr_setting: motorData.eocr_setting,
        breaker_setting: motorData.breaker_setting,
        updated_at: new Date().toISOString()
      })
      .eq('id', motorId)
      .select()
      .single()

    if (error) {
      console.error('모터 사양 수정 오류:', error)
      return NextResponse.json({ error: '모터 사양 수정 실패' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('모터 사양 수정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// 모터 사양 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const motorId = searchParams.get('motorId')
    
    if (!motorId) {
      return NextResponse.json({ error: 'Motor ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_motors')
      .delete()
      .eq('id', motorId)

    if (error) {
      console.error('모터 사양 삭제 오류:', error)
      return NextResponse.json({ error: '모터 사양 삭제 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('모터 사양 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
