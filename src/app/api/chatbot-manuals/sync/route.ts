import { NextRequest, NextResponse } from 'next/server'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getAssistantGoogleAuth } from '@/lib/assistantGoogle'
import { syncManualsFromDrive } from '@/lib/chatbotManualSync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// OCR 변환 + 임베딩이 파일당 수 초 → 기본 한도를 넘길 수 있어 늘림
export const maxDuration = 60

// 구글 드라이브 폴더의 매뉴얼을 챗봇(machine_manual_links + 임베딩)으로 동기화한다.
export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ ok: false, error: '비서 관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const folderId = String(body?.folderId || '').trim()
    if (!folderId) {
      return NextResponse.json({ ok: false, error: '드라이브 폴더 링크 또는 ID를 입력하세요.' }, { status: 400 })
    }

    const { auth } = await getAssistantGoogleAuth(owner.id)
    const result = await syncManualsFromDrive({ auth, folderId })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || '매뉴얼 동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
