import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 프로젝트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { projectName, projectNumber, assemblyDate, factoryTestDate, siteTestDate, remarks } = await request.json()

  try {
    if (!projectName || !projectNumber) {
      return NextResponse.json({ error: '프로젝트명과 프로젝트번호는 필수입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        project_name: projectName,
        project_number: projectNumber,
        assembly_date: assemblyDate || null,
        factory_test_date: factoryTestDate || null,
        site_test_date: siteTestDate || null,
        remarks: remarks || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: '프로젝트가 성공적으로 수정되었습니다.',
      data: data[0]
    }, { status: 200 })
  } catch (error) {
    console.error('프로젝트 수정 오류:', error)
    return NextResponse.json({ error: '프로젝트 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 프로젝트 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '프로젝트가 성공적으로 삭제되었습니다.' }, { status: 200 })
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error)
    return NextResponse.json({ error: '프로젝트 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
