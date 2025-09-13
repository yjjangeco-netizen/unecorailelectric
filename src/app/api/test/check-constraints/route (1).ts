import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    console.log('제약조건 확인 시작...')

    // items 테이블의 stock_status 컬럼 정보 조회
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'items')
      .eq('column_name', 'stock_status')

    if (columnError) {
      console.error('컬럼 정보 조회 오류:', columnError)
      return NextResponse.json({ 
        error: '컬럼 정보 조회 실패', 
        details: columnError.message 
      }, { status: 500 })
    }

    // 제약조건 정보 조회
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .eq('constraint_name', 'items_stock_status_check')

    if (constraintError) {
      console.error('제약조건 정보 조회 오류:', constraintError)
      return NextResponse.json({ 
        error: '제약조건 정보 조회 실패', 
        details: constraintError.message 
      }, { status: 500 })
    }

    // 현재 stock_status 값들 조회
    const { data: currentValues, error: valuesError } = await supabase
      .from('items')
      .select('stock_status')
      .not('stock_status', 'is', null)

    if (valuesError) {
      console.error('현재 값 조회 오류:', valuesError)
      return NextResponse.json({ 
        error: '현재 값 조회 실패', 
        details: valuesError.message 
      }, { status: 500 })
    }

    // 고유한 값들 추출
    const uniqueValues = [...new Set(currentValues.map(item => item.stock_status))]

    console.log('제약조건 확인 완료!')

    return NextResponse.json({ 
      success: true, 
      columns: columns,
      constraints: constraints,
      currentValues: uniqueValues,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('제약조건 확인 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
