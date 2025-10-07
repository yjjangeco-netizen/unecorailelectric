import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 프로젝트 목록 조회
export async function GET(_request: NextRequest) {
  try {
    console.log('프로젝트 조회 시작...')
    
    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase 조회 오류:', error)
      return NextResponse.json(
        { error: '프로젝트 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log('조회된 데이터:', data)

    const projects = data?.map(item => ({
        id: item.id.toString(), // INTEGER to STRING
        project_number: item.project_number || '',
        name: item.project_name || '', // FIXED: project_name
        description: item.description || '',
        status: item.ProjectStatus || 'Manufacturing',
        priority: item.priority || 'medium',
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        assembly_date: item.assembly_date || '',
        factory_test_date: item.factory_test_date || '',
        site_test_date: item.site_test_date || '',
        completion_date: item.completion_date || '',
        warranty_period: item.warranty_period || '',
        budget: item.budget || 0,
        manager_id: item.manager_id || '',
        client_name: item.client_name || '',
        client_contact: item.client_contact || '',
        created_by: item.created_by || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        
        // 기본 정보
        base_name: item.base_name || '',
      
      // 사양 정보
      hardware_version: item.hardware_version || '',
      has_disk: item.has_disk || false,
      incoming_power: item.incoming_power || '',
      primary_breaker: item.primary_breaker || '',
      
      // 전원사양
      pvr_ampere: item.pvr_ampere || 0,
      frequency: item.frequency || 0,
      
      // Drive 사양
      spindle_spec: item.spindle_spec || '',
      tool_post_spec: item.tool_post_spec || '',
      pump_low_spec: item.pump_low_spec || '',
      pump_high_spec: item.pump_high_spec || '',
      crusher_spec: item.crusher_spec || '',
      conveyor_spec: item.conveyor_spec || '',
      dust_collector_spec: item.dust_collector_spec || '',
      
      // 380V motor 사양
      vehicle_transfer_device: item.vehicle_transfer_device || '',
      oil_heater: item.oil_heater || '',
      cooling_fan: item.cooling_fan || '',
      chiller: item.chiller || '',
      
      // 220V motor 사양
      lubrication: item.lubrication || '',
      grease: item.grease || '',
      
      // 차륜관리시스템
      cctv_spec: item.cctv_spec || '',
      automatic_cover: item.automatic_cover || '',
      ups_spec: item.ups_spec || '',
      configuration: item.configuration || '',
      
      // 색상
      main_color: item.main_color || '',
      auxiliary_color: item.auxiliary_color || '',
      
      // 옵션
      warning_light: item.warning_light || false,
      buzzer: item.buzzer || false,
      speaker: item.speaker || false,
      automatic_rail: item.automatic_rail || false,
    })) || []

    console.log('변환된 프로젝트:', projects)

    return NextResponse.json(projects, { status: 200 })
  } catch (error) {
    console.error('프로젝트 조회 오류:', error)
    return NextResponse.json({ error: '프로젝트 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    // Supabase 직접 연결
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const projectData = await request.json()

    if (!projectData.name || !projectData.project_number) {
      return NextResponse.json({ error: '프로젝트명과 프로젝트번호는 필수입니다' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          project_number: projectData.project_number,
          project_name: projectData.name, // FIXED: project_name
          description: projectData.description || null,
          ProjectStatus: projectData.status || 'Manufacturing', // FIXED: ProjectStatus
          priority: projectData.priority || 'medium',
          start_date: projectData.start_date || null,
          end_date: projectData.end_date || null,
          budget: projectData.budget || null,
          manager_id: projectData.manager_id || null,
          client_name: projectData.client_name || null,
          client_contact: projectData.client_contact || null,
          created_by: projectData.created_by || '1', // 임시 사용자ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // 기본 정보
          base_name: projectData.base_name || null,
          
          // 사양 정보
          hardware_version: projectData.hardware_version || null,
          has_disk: projectData.has_disk || false,
          incoming_power: projectData.incoming_power || null,
          primary_breaker: projectData.primary_breaker || null,
          
          // 전원사양
          pvr_ampere: projectData.pvr_ampere || null,
          frequency: projectData.frequency || null,
          
          // Drive 사양
          spindle_spec: projectData.spindle_spec || null,
          tool_post_spec: projectData.tool_post_spec || null,
          pump_low_spec: projectData.pump_low_spec || null,
          pump_high_spec: projectData.pump_high_spec || null,
          crusher_spec: projectData.crusher_spec || null,
          conveyor_spec: projectData.conveyor_spec || null,
          dust_collector_spec: projectData.dust_collector_spec || null,
          
          // 380V motor 사양
          vehicle_transfer_device: projectData.vehicle_transfer_device || null,
          oil_heater: projectData.oil_heater || null,
          cooling_fan: projectData.cooling_fan || null,
          chiller: projectData.chiller || null,
          
          // 220V motor 사양
          lubrication: projectData.lubrication || null,
          grease: projectData.grease || null,
          
          // 차륜관리시스템
          cctv_spec: projectData.cctv_spec || null,
          automatic_cover: projectData.automatic_cover || null,
          ups_spec: projectData.ups_spec || null,
          configuration: projectData.configuration || null,
          
          // 색상
          main_color: projectData.main_color || null,
          auxiliary_color: projectData.auxiliary_color || null,
          
          // 옵션
          warning_light: projectData.warning_light || false,
          buzzer: projectData.buzzer || false,
          speaker: projectData.speaker || false,
          automatic_rail: projectData.automatic_rail || false,
        }
      ])
      .select()

    if (error) {
      console.error('Supabase 생성 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '프로젝트가 성공적으로 생성되었습니다.',
      data: data?.[0]
    }, { status: 201 })
  } catch (error) {
    console.error('프로젝트 생성 오류:', error)
    return NextResponse.json({ error: '프로젝트 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}