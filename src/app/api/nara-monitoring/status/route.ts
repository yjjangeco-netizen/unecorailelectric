import { NextRequest, NextResponse } from 'next/server'

// 임시 데이터 - 실제로는 데이터베이스나 캐시에서 가져와야 함
const mockBidItems = [
  {
    id: '1',
    title: '전기케이블 공급업체 선정공고',
    source: 'korail',
    url: 'https://example.com/bid/1',
    price: '50,000,000원',
    deadline: '2024-01-15 18:00',
    status: 'active',
    createdAt: '2024-01-10T09:00:00Z'
  },
  {
    id: '2',
    title: '변압기 설치 및 유지보수',
    source: 'naramarket',
    url: 'https://example.com/bid/2',
    price: '30,000,000원',
    deadline: '2024-01-12 17:00',
    status: 'ending',
    createdAt: '2024-01-08T14:30:00Z'
  },
  {
    id: '3',
    title: '전력설비 점검 및 보수',
    source: 'korail',
    url: 'https://example.com/bid/3',
    price: '25,000,000원',
    deadline: '2024-01-05 16:00',
    status: 'ended',
    createdAt: '2024-01-03T11:20:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    // TODO: 실제 모니터링 상태 확인 로직 구현
    // - 모니터링 서비스 상태 확인
    // - 데이터베이스에서 입찰 공고 조회
    // - 설정 정보 반환

    const isMonitoring = true // 임시로 항상 true
    const bidItems = mockBidItems

    return NextResponse.json({
      isMonitoring,
      bidItems,
      lastCheck: new Date().toISOString(),
      config: {
        keywords: ['전기', '케이블', '변압기'],
        telegramEnabled: false,
        telegramChatId: '',
        checkInterval: 30
      }
    })
  } catch (error) {
    console.error('상태 확인 오류:', error)
    return NextResponse.json(
      { message: '상태 확인에 실패했습니다.' },
      { status: 500 }
    )
  }
}