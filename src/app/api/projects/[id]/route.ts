import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 개별 프로젝트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    console.log('개별 프로젝트 조회 요청:', { projectId })

    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Supabase 조회 오류:', error)
      return NextResponse.json({
        error: '프로젝트 조회에 실패했습니다',
        details: error
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        error: '프로젝트를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // 데이터 변환
    const project = {
      id: data.id.toString(),
      project_number: data.project_number || '',
      name: data.project_name || '',
      category: data.category || 'project', // DB: category
      description: data.description || '',
      status: data.ProjectStatus || 'Manufacturing',
      priority: data.priority || 'medium',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      assembly_date: data.assembly_date || '',
      factory_test_date: data.factory_test_date || '',
      site_test_date: data.site_test_date || '',
      completion_date: data.completion_date || '',
      warranty_period: data.warranty_period || '',
      budget: data.budget || 0,
      manager_id: data.manager_id || '',
      client_name: data.client_name || '',
      client_contact: data.client_contact || '',
      created_by: data.created_by || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      
      // 기본 정보
      base_name: data.base_name || '',
      
      // 사양 정보
      hardware_version: data.hardware_version || '',
      has_disk: data.has_disk || false,
      incoming_power: data.incoming_power || '',
      primary_breaker: data.primary_breaker || '',
      
      // 전원사양
      pvr_ampere: data.pvr_ampere || 0,
      frequency: data.frequency || 0,
      
      // Drive 사양
      spindle_spec: data.spindle_spec || '',
      tool_post_spec: data.tool_post_spec || '',
      pump_low_spec: data.pump_low_spec || '',
      pump_high_spec: data.pump_high_spec || '',
      crusher_spec: data.crusher_spec || '',
      conveyor_spec: data.conveyor_spec || '',
      dust_collector_spec: data.dust_collector_spec || '',
      
      // 380V motor 사양
      vehicle_transfer_device: data.vehicle_transfer_device || '',
      oil_heater: data.oil_heater || '',
      cooling_fan: data.cooling_fan || '',
      chiller: data.chiller || '',
      
      // 220V motor 사양
      lubrication: data.lubrication || '',
      grease: data.grease || '',
      
      // 차륜관리시스템
      cctv_spec: data.cctv_spec || '',
      automatic_cover: data.automatic_cover || '',
      ups_spec: data.ups_spec || '',
      configuration: data.configuration || '',
      
      // 색상
      main_color: data.main_color || '',
      auxiliary_color: data.auxiliary_color || '',
      
      // 옵션
      warning_light: data.warning_light || false,
      buzzer: data.buzzer || false,
      speaker: data.speaker || false,
      automatic_rail: data.automatic_rail || false,
    }

    console.log('조회된 프로젝트:', project)

    return NextResponse.json(project, { status: 200 })
  } catch (error) {
    console.error('프로젝트 조회 오류:', error)
    return NextResponse.json({
      error: '프로젝트 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 프로젝트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const projectData = await request.json()

    console.log('프로젝트 업데이트 요청:', { projectId, projectData })

    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 업데이트할 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // 모든 필드 업데이트 (프론트엔드 필드명과 API 필드명 매핑)
    if (projectData.project_number) updateData.project_number = projectData.project_number
    if (projectData.name !== undefined) updateData.project_name = projectData.name
    if (projectData.category !== undefined) updateData.category = projectData.category
    if (projectData.description !== undefined) updateData.description = projectData.description
    if (projectData.status) {
      updateData.ProjectStatus = projectData.status
    }
    if (projectData.priority) updateData.priority = projectData.priority
    if (projectData.start_date !== undefined) updateData.start_date = projectData.start_date || null
    if (projectData.end_date !== undefined) updateData.end_date = projectData.end_date || null
    if (projectData.assembly_date !== undefined) updateData.assembly_date = projectData.assembly_date || null
    if (projectData.factory_test_date !== undefined) updateData.factory_test_date = projectData.factory_test_date || null
    if (projectData.site_test_date !== undefined) updateData.site_test_date = projectData.site_test_date || null
    if (projectData.completion_date !== undefined) updateData.completion_date = projectData.completion_date || null
    if (projectData.warranty_period !== undefined) updateData.warranty_period = projectData.warranty_period
    if (projectData.budget !== undefined) updateData.budget = projectData.budget
    if (projectData.manager_id !== undefined) updateData.manager_id = projectData.manager_id
    if (projectData.client_name !== undefined) updateData.client_name = projectData.client_name
    if (projectData.client_contact !== undefined) updateData.client_contact = projectData.client_contact
    
    // 기본 필드들만 업데이트 (실제 DB에 존재하는 컬럼들)
    if (projectData.base_name !== undefined) updateData.base_name = projectData.base_name
    if (projectData.hardware_version !== undefined) updateData.hardware_version = projectData.hardware_version
    if (projectData.has_disk !== undefined) updateData.has_disk = projectData.has_disk
    if (projectData.incoming_power !== undefined) updateData.incoming_power = projectData.incoming_power
    if (projectData.primary_breaker !== undefined) updateData.primary_breaker = projectData.primary_breaker
    if (projectData.pvr_ampere !== undefined) updateData.pvr_ampere = projectData.pvr_ampere
    if (projectData.frequency !== undefined) updateData.frequency = projectData.frequency
    if (projectData.spindle_spec !== undefined) updateData.spindle_spec = projectData.spindle_spec
    if (projectData.tool_post_spec !== undefined) updateData.tool_post_spec = projectData.tool_post_spec
    if (projectData.pump_low_spec !== undefined) updateData.pump_low_spec = projectData.pump_low_spec
    if (projectData.pump_high_spec !== undefined) updateData.pump_high_spec = projectData.pump_high_spec
    if (projectData.crusher_spec !== undefined) updateData.crusher_spec = projectData.crusher_spec
    if (projectData.conveyor_spec !== undefined) updateData.conveyor_spec = projectData.conveyor_spec
    if (projectData.dust_collector_spec !== undefined) updateData.dust_collector_spec = projectData.dust_collector_spec
    if (projectData.vehicle_transfer_device !== undefined) updateData.vehicle_transfer_device = projectData.vehicle_transfer_device
    if (projectData.oil_heater !== undefined) updateData.oil_heater = projectData.oil_heater
    if (projectData.cooling_fan !== undefined) updateData.cooling_fan = projectData.cooling_fan
    if (projectData.chiller !== undefined) updateData.chiller = projectData.chiller
    if (projectData.lubrication !== undefined) updateData.lubrication = projectData.lubrication
    if (projectData.grease !== undefined) updateData.grease = projectData.grease
    if (projectData.cctv_spec !== undefined) updateData.cctv_spec = projectData.cctv_spec
    // automatic_cover 컬럼이 존재하지 않으므로 제거
    if (projectData.ups_spec !== undefined) updateData.ups_spec = projectData.ups_spec
    if (projectData.configuration !== undefined) updateData.configuration = projectData.configuration
    if (projectData.main_color !== undefined) updateData.main_color = projectData.main_color
    if (projectData.auxiliary_color !== undefined) updateData.auxiliary_color = projectData.auxiliary_color
    if (projectData.warning_light !== undefined) updateData.warning_light = projectData.warning_light
    if (projectData.buzzer !== undefined) updateData.buzzer = projectData.buzzer
    if (projectData.speaker !== undefined) updateData.speaker = projectData.speaker
    if (projectData.automatic_rail !== undefined) updateData.automatic_rail = projectData.automatic_rail

    console.log('업데이트할 데이터:', updateData)

    const { data: updatedData, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()

    if (error) {
      console.error('Supabase 수정 오류:', error)
      return NextResponse.json({
        error: error.message,
        details: error,
        projectId,
        updateData
      }, { status: 500 })
    }

    console.log('업데이트 성공:', updatedData)

    return NextResponse.json({
      message: '프로젝트가 성공적으로 수정되었습니다.',
      data: updatedData?.[0]
    }, { status: 200 })
  } catch (error) {
    console.error('프로젝트 수정 오류:', error)
    return NextResponse.json({
      error: '프로젝트 수정 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // 헤더에서 사용자 정보 확인
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')

    // 권한 확인: Level 5 또는 Admin만 삭제 가능
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'

    if (!isLevel5 && !isAdmin) {
      console.log('프로젝트 삭제 권한 없음:', { userId, userLevel })
      return NextResponse.json({ 
        error: 'Forbidden: Level 5 또는 관리자만 프로젝트를 삭제할 수 있습니다.' 
      }, { status: 403 })
    }

    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 프로젝트 존재 확인
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, project_number')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      console.error('프로젝트 조회 오류:', fetchError)
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 삭제 실행
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Supabase 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '프로젝트가 성공적으로 삭제되었습니다.'
    }, { status: 200 })
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error)
    return NextResponse.json({ error: '프로젝트 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}