import { NextResponse } from 'next/server'

// 정적 생성을 위한 설정
export const dynamic = 'force-static'
export const revalidate = false

export async function GET() {
  return NextResponse.json({ message: 'Test Search API' })
}
