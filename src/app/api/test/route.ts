import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '테스트 API가 정상적으로 작동합니다!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({
    success: true,
    message: 'POST 요청이 정상적으로 처리되었습니다!',
    receivedData: body,
    timestamp: new Date().toISOString()
  })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({
    success: true,
    message: 'PUT 요청이 정상적으로 처리되었습니다!',
    receivedData: body,
    timestamp: new Date().toISOString()
  })
}
