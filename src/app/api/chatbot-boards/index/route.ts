import { NextRequest, NextResponse } from 'next/server'
import {
  hardwareLabelToType,
  indexBoardPost,
  machineLabelToType
} from '@/lib/boardChatbotIndex'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 게시판 글을 QR 챗봇 의미검색 색인에 반영한다.
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다.' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const { postId, title, html, machine, version } = body || {}
    if (!postId || !title) {
      return NextResponse.json({ ok: false, error: 'postId, title이 필요합니다.' }, { status: 400 })
    }

    const indexed = await indexBoardPost({
      postId: String(postId),
      title: String(title),
      html: String(html || ''),
      machineType: machineLabelToType(machine),
      hardwareType: hardwareLabelToType(version)
    })

    return NextResponse.json({ ok: true, indexed })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || '챗봇 색인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
