import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getAssistantGoogleAuth, resolveDriveFolderId } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const startDate = body.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    const endDate = body.endDate || new Date().toISOString().slice(0, 10)

    const { data: expenses, error } = await supabaseServer
      .from('assistant_expenses')
      .select('*')
      .eq('user_id', owner.id)
      .gte('transaction_at', `${startDate}T00:00:00+09:00`)
      .lte('transaction_at', `${endDate}T23:59:59+09:00`)
      .order('transaction_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message, setupSql: 'database/create_assistant_automation.sql' }, { status: 500 })
    }

    const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
    const sheets = google.sheets({ version: 'v4', auth })
    const drive = google.drive({ version: 'v3', auth })
    const folderId = await resolveDriveFolderId(drive, driveFolderId)

    const fileName = '카드내역'
    const existing = await drive.files.list({
      q: `name='${fileName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name, parents, webViewLink)',
      pageSize: 1
    })

    let spreadsheetId = existing.data.files?.[0]?.id || null
    if (!spreadsheetId) {
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: fileName },
          sheets: [{ properties: { title: startDate.slice(0, 7) } }]
        }
      })
      spreadsheetId = spreadsheet.data.spreadsheetId || null
    }

    if (!spreadsheetId) throw new Error('Google Sheets 파일 생성에 실패했습니다.')

    const monthSheet = startDate.slice(0, 7)
    const meta = await sheets.spreadsheets.get({ spreadsheetId })
    const hasMonthSheet = meta.data.sheets?.some((sheet) => sheet.properties?.title === monthSheet)
    if (!hasMonthSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: monthSheet } } }]
        }
      })
    }

    const rows = [
      ['이용일', '이용시간', '이용카드명', '이용하신곳', '국내이용금(원)', '결제예정일', '내역', '비고'],
      ...(expenses || []).map((expense: any) => [
        String(expense.transaction_at || '').slice(0, 10),
        String(expense.transaction_at || '').slice(11, 16),
        expense.card_name || '',
        expense.merchant || '',
        expense.amount || 0,
        expense.payment_due_date || '',
        expense.category || expense.source_message || '',
        expense.memo || ''
      ])
    ]

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${monthSheet}!A:H`
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${monthSheet}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    })

    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      fields: 'id, name, webViewLink'
    })

    const file = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'id, name, webViewLink'
    })

    return NextResponse.json({
      ok: true,
      count: expenses?.length || 0,
      file: file.data
    })
  } catch (error) {
    console.error('Expense export error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '카드내역 내보내기에 실패했습니다.'
    }, { status: 500 })
  }
}
