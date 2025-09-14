import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 프로젝트 목록 조회
export async function GET(_request: NextRequest) {
  try {
    console.log('프로젝트 조회 시작...')
    
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase 환경 변수가 설정되지 않음, Mock 데이터 사용')
      const mockProjects = [
        {
          id: 1,
          project_name: '전기설비 유지보수',
          project_number: 'EL-2024-001',
          description: 'A동 전기설비 정기점검',
          assemblyDate: '2024-01-10',
          factoryTestDate: '2024-01-12',
          siteTestDate: '2024-01-15',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          project_name: '신규 설치',
          project_number: 'EL-2024-002',
          description: 'B동 신규 전기설비 설치',
          assemblyDate: '2024-01-08',
          factoryTestDate: '2024-01-10',
          siteTestDate: '2024-01-14',
          createdAt: '2024-01-08T10:00:00Z',
          updatedAt: '2024-01-14T10:30:00Z'
        },
        {
          id: 3,
          project_name: '고장 수리',
          project_number: 'EL-2024-003',
          description: 'C동 조명 고장 수리',
          assemblyDate: '2024-01-05',
          factoryTestDate: '2024-01-07',
          siteTestDate: '2024-01-13',
          createdAt: '2024-01-05T14:00:00Z',
          updatedAt: '2024-01-13T14:20:00Z'
        }
      ]
      
      return NextResponse.json(mockProjects, { status: 200 })
    }
    
    console.log('Supabase 환경 변수 확인됨, 데이터베이스에서 프로젝트 조회 시작...')
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase 조회 오류, Mock 데이터 사용:', error)
      // Mock 데이터 반환
      const mockProjects = [
        {
          id: 1,
          project_name: '전기설비 유지보수',
          project_number: 'EL-2024-001',
          description: 'A동 전기설비 정기점검',
          assemblyDate: '2024-01-10',
          factoryTestDate: '2024-01-12',
          siteTestDate: '2024-01-15',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          project_name: '신규 설치',
          project_number: 'EL-2024-002',
          description: 'B동 신규 전기설비 설치',
          assemblyDate: '2024-01-08',
          factoryTestDate: '2024-01-10',
          siteTestDate: '2024-01-14',
          createdAt: '2024-01-08T10:00:00Z',
          updatedAt: '2024-01-14T10:30:00Z'
        },
        {
          id: 3,
          project_name: '고장 수리',
          project_number: 'EL-2024-003',
          description: 'C동 조명 고장 수리',
          assemblyDate: '2024-01-05',
          factoryTestDate: '2024-01-07',
          siteTestDate: '2024-01-13',
          createdAt: '2024-01-05T14:00:00Z',
          updatedAt: '2024-01-13T14:20:00Z'
        }
      ]
      
      return NextResponse.json(mockProjects, { status: 200 })
    }

    console.log('조회된 데이터:', data)

    const projects = data?.map(item => ({
      id: item.id,
      project_name: item.project_name || '',
      project_number: item.project_number || '',
      description: item.description || '',
      assemblyDate: item.assembly_date || '',
      factoryTestDate: item.factory_test_date || '',
      siteTestDate: item.site_test_date || '',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
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
    const { projectName, projectNumber, assemblyDate, factoryTestDate, siteTestDate, remarks } = await request.json()

    if (!projectName || !projectNumber) {
      return NextResponse.json({ error: '프로젝트명과 프로젝트번호는 필수입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          project_name: projectName,
          project_number: projectNumber,
          description: remarks || null,
          assembly_date: assemblyDate || null,
          factory_test_date: factoryTestDate || null,
          site_test_date: siteTestDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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