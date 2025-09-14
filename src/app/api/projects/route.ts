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
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }
    
    console.log('Supabase 환경 변수 확인됨, 데이터베이스에서 프로젝트 조회 시작...')
    
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
      id: item.id,
      project_name: item.projectName || item.project_name || '',
      project_number: item.projectNumber || item.project_number || '',
      description: item.description || '',
      assemblyDate: item.assemblyDate || item.assembly_date || '',
      factoryTestDate: item.factoryTestDate || item.factory_test_date || '',
      siteTestDate: item.siteTestDate || item.site_test_date || '',
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
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