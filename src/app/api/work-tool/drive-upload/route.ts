import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { google } from 'googleapis'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getAssistantGoogleAuth, resolveDriveFolderId } from '@/lib/assistantGoogle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const esc = (s: string) => s.replace(/'/g, "\\'")

async function ensureFolder(drive: any, parentId: string, name: string): Promise<string> {
  const found = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${esc(name)}' and '${esc(parentId)}' in parents and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  })
  if (found.data.files?.[0]?.id) return found.data.files[0].id as string
  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: 'id',
    supportsAllDrives: true
  })
  return created.data.id as string
}

// 업무툴 등 자료실 폴더(manual/<folder>/original)에 파일 업로드.
export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ ok: false, error: '비서 관리자 권한이 필요합니다.' }, { status: 403 })
    }
    const fd = await request.formData()
    const file = fd.get('file') as File | null
    const folder = String(fd.get('folder') || '')
    if (!file || !folder) {
      return NextResponse.json({ ok: false, error: '파일과 폴더가 필요합니다.' }, { status: 400 })
    }

    const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
    const drive = google.drive({ version: 'v3', auth })
    const rootId = await resolveDriveFolderId(drive, driveFolderId)
    const subId = await ensureFolder(drive, rootId, folder)
    const originalId = await ensureFolder(drive, subId, 'original')

    const buffer = Buffer.from(await file.arrayBuffer())
    const created = await drive.files.create({
      requestBody: { name: file.name, parents: [originalId] },
      media: { mimeType: file.type || 'application/octet-stream', body: Readable.from(buffer) },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true
    })

    return NextResponse.json({ ok: true, file: created.data })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || '업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
