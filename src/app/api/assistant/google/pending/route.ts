import { NextRequest, NextResponse } from 'next/server'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getPendingSyncItems, applyPendingUpdate } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const items = await getPendingSyncItems(owner.id)
    return NextResponse.json(items)
  } catch (error) {
    console.error('Get pending items error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '대기 중인 항목 조회 실패'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { linkId, action } = body

    if (!linkId) {
      return NextResponse.json({ error: 'linkId가 필요합니다.' }, { status: 400 })
    }

    if (action === 'apply_all') {
      // 보류 중인 모든 항목 적용 (바디에서 linkId가 배열 형태로 올 수도 있고, 아니면 별도의 파라미터일 수도 있음. 여기서는 linkId가 배열인 경우를 지원)
      const linkIds = Array.isArray(linkId) ? linkId : [linkId]
      const results = []
      for (const id of linkIds) {
        try {
          await applyPendingUpdate(id, owner)
          results.push({ id, success: true })
        } catch (err) {
          console.error(`수동 업데이트 실패 (linkId: ${id}):`, err)
          results.push({ id, success: false, error: err instanceof Error ? err.message : '오류 발생' })
        }
      }
      return NextResponse.json({ success: true, results })
    }

    // 단일 항목 적용
    const result = await applyPendingUpdate(linkId, owner)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Apply pending update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '수동 업데이트 반영 실패'
    }, { status: 500 })
  }
}
