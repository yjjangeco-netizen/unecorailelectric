import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

export const dynamic = 'force-dynamic'

function parseExpenseMessage(message: string) {
  const amountMatch = message.match(/([\d,]+)\s*원/)
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0
  const approved = /(승인|사용|결제|체크|일시불)/.test(message)
  const cardMatch = message.match(/([가-힣A-Za-z0-9]+카드)/)
  const merchantMatch = message.match(/원\s+([^\n\r]+?)(?:\s+(?:승인|사용|결제)|$)/)

  return {
    amount,
    approved,
    card_name: cardMatch?.[1] || null,
    merchant: merchantMatch?.[1]?.trim().slice(0, 80) || null
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json()
    const message = String(body.message || '').trim()

    if (!message) {
      return NextResponse.json({ error: '문자 내용이 필요합니다.' }, { status: 400 })
    }

    const parsed = parseExpenseMessage(message)

    if (!parsed.approved || parsed.amount <= 0) {
      return NextResponse.json({ parsed, saved: false, reason: '카드 승인 문자로 인식하지 않았습니다.' })
    }

    const { data, error } = await supabaseServer
      .from('assistant_expenses')
      .insert({
        user_id: owner.id,
        source_message: message,
        transaction_at: body.transaction_at || new Date().toISOString(),
        merchant: parsed.merchant,
        amount: parsed.amount,
        card_name: parsed.card_name,
        category: body.category || null,
        memo: body.memo || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        parsed,
        saved: false,
        setupSql: 'database/create_assistant_automation.sql',
        error: error.message
      })
    }

    return NextResponse.json({ parsed, saved: true, expense: data })
  } catch (error) {
    console.error('Assistant expense error:', error)
    return NextResponse.json({ error: '가계부 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
