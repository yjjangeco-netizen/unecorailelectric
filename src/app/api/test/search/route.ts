import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { query, category, minPrice, maxPrice, inStock } = body

    // 입력값 검증
    if (!query || query.length < 1) {
      return NextResponse.json({
        ok: false,
        error: '검색어가 비어있습니다'
      }, { status: 400 })
    }

    if (query.length > 200) {
      return NextResponse.json({
        ok: false,
        error: '검색어가 너무 깁니다 (200자 이하)'
      }, { status: 400 })
    }

    // 테스트용 더미 데이터
    const dummyResults = [
      {
        id: '1',
        name: '테스트 품목 1',
        specification: '규격 A',
        unit_price: 5000,
        current_quantity: 100,
        total_amount: 500000,
        category: '전기자재',
        stock_status: 'normal'
      },
      {
        id: '2',
        name: '테스트 품목 2',
        specification: '규격 B',
        unit_price: 3000,
        current_quantity: 50,
        total_amount: 150000,
        category: '전기자재',
        stock_status: 'normal'
      }
    ]

    // 검색어에 따라 결과 필터링
    const filteredResults = dummyResults.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.specification.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    )

    // 검색 통계 계산
    const totalQuantity = filteredResults.reduce((sum, item) => sum + (item.current_quantity || 0), 0)
    const totalValue = filteredResults.reduce((sum, item) => sum + (item.total_amount || 0), 0)
    const averagePrice = filteredResults.length > 0 ? totalValue / totalQuantity : 0

    // 카테고리별 분포
    const categoryDistribution = filteredResults.reduce((acc, item) => {
      const cat = item.category || '미분류'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      ok: true,
      message: '검색 완료 (테스트 데이터)',
      data: {
        query,
        category,
        minPrice,
        maxPrice,
        inStock,
        resultCount: filteredResults.length,
        totalQuantity,
        totalValue,
        averagePrice: Math.round(averagePrice),
        categoryDistribution,
        results: filteredResults,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('검색 테스트 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '검색 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // GET 요청용 간단한 검색
    if (!query || query.length < 1) {
      return NextResponse.json({
        ok: false,
        error: '검색어가 비어있습니다'
      }, { status: 400 })
    }

    // 테스트용 더미 데이터
    const dummyResults = [
      {
        id: '1',
        name: '테스트 품목 1',
        specification: '규격 A',
        unit_price: 5000,
        current_quantity: 100,
        total_amount: 500000,
        category: '전기자재',
        stock_status: 'normal'
      },
      {
        id: '2',
        name: '테스트 품목 2',
        specification: '규격 B',
        unit_price: 3000,
        current_quantity: 50,
        total_amount: 150000,
        category: '전기자재',
        stock_status: 'normal'
      }
    ]

    // 검색어에 따라 결과 필터링
    const filteredResults = dummyResults.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.specification.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json({
      ok: true,
      message: '검색 완료 (테스트 데이터)',
      data: {
        query,
        resultCount: filteredResults.length,
        totalQuantity: filteredResults.reduce((sum, item) => sum + (item.current_quantity || 0), 0),
        totalValue: filteredResults.reduce((sum, item) => sum + (item.total_amount || 0), 0),
        results: filteredResults,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('검색 테스트 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '검색 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
