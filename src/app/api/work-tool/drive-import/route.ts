import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getAssistantGoogleAuth, resolveDriveFolderId } from '@/lib/assistantGoogle'
import { supabaseServer } from '@/lib/supabaseServer'
import { classifyWorkToolDocument } from '@/lib/workToolImport'

export const dynamic = 'force-dynamic'

type DriveClient = ReturnType<typeof google.drive>

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const MANUAL_FOLDER_NAME = 'manual'
const SOURCE_ORIGINAL_FOLDER_NAME = 'main-original'
const COPIED_FOLDER_NAME = 'copied'

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function ensureDriveFolder(drive: DriveClient, parentId: string, name: string) {
  const escapedName = escapeDriveQuery(name)
  const escapedParent = escapeDriveQuery(parentId)
  const existing = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escapedName}' and '${escapedParent}' in parents and trashed=false`,
    fields: 'files(id, name, webViewLink)',
    pageSize: 1,
    spaces: 'drive'
  })

  const folder = existing.data.files?.[0]
  if (folder?.id) return folder

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId]
    },
    fields: 'id, name, webViewLink'
  })

  if (!created.data.id) {
    throw new Error(`${name} Drive 폴더 생성에 실패했습니다.`)
  }

  return created.data
}

async function listOriginalFiles(drive: DriveClient, originalFolderId: string) {
  const files: any[] = []
  let pageToken: string | undefined
  const escapedParent = escapeDriveQuery(originalFolderId)

  do {
    const result = await drive.files.list({
      q: `'${escapedParent}' in parents and trashed=false and mimeType!='${FOLDER_MIME}'`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, description, parents)',
      spaces: 'drive',
      pageSize: 100,
      pageToken
    })
    files.push(...(result.data.files || []))
    pageToken = result.data.nextPageToken || undefined
  } while (pageToken)

  return files
}

function buildBoardContent(params: {
  fileName: string
  copiedFile: any
  originalFile: any
  classification: ReturnType<typeof classifyWorkToolDocument>
}) {
  const { fileName, copiedFile, originalFile, classification } = params
  return [
    `## ${classification.title}`,
    '',
    '### 분류',
    '',
    `- 문서 그룹: ${classification.documentGroup}`,
    `- 기기면: ${classification.machineType}`,
    `- 하드웨어명: ${classification.hardwareType}`,
    `- 자동 분류 근거: ${classification.reason}`,
    '',
    '### 파일',
    '',
    `- 분류 복사본: [${fileName}](${copiedFile.webViewLink || ''})`,
    `- 원본 백업: [${fileName}](${originalFile.webViewLink || ''})`,
    '',
    '### 안내',
    '',
    '이 문서는 Google Drive `Unecorail/manual/main-original` 폴더에서 자동 분류되어 등록되었습니다.',
    '원본은 `Unecorail/manual/main-original/copied` 폴더로 이동되며, 분류된 복사본은 `Unecorail/manual` 아래 각 업무도구 폴더의 `Original` 폴더에 보관됩니다.'
  ].join('\n')
}

async function insertBoardWithMetadata(params: {
  owner: { id: string; name?: string | null }
  originalFile: any
  copiedFile: any
  classification: ReturnType<typeof classifyWorkToolDocument>
}) {
  const { owner, originalFile, copiedFile, classification } = params
  const content = buildBoardContent({
    fileName: originalFile.name,
    originalFile,
    copiedFile,
    classification
  })

  const richPayload = {
    board_type: classification.boardType,
    title: classification.title,
    content,
    author_id: owner.id,
    author_name: owner.name || '관리자',
    views: 0,
    drive_file_id: copiedFile.id,
    drive_web_url: copiedFile.webViewLink || null,
    drive_original_file_id: originalFile.id,
    drive_original_web_url: originalFile.webViewLink || null,
    document_group: classification.documentGroup,
    machine_type: classification.machineType,
    hardware_type: classification.hardwareType,
    imported_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: duplicateByDriveId, error: duplicateDriveError } = await supabaseServer
    .from('work_tool_boards')
    .select('id')
    .eq('drive_original_file_id', originalFile.id)
    .maybeSingle()

  if (duplicateByDriveId?.id) {
    return { skipped: true, id: duplicateByDriveId.id }
  }

  if (duplicateDriveError && duplicateDriveError.code !== '42703') {
    throw duplicateDriveError
  }

  const { data: duplicateByTitle } = await supabaseServer
    .from('work_tool_boards')
    .select('id')
    .eq('board_type', classification.boardType)
    .eq('title', classification.title)
    .maybeSingle()

  if (duplicateByTitle?.id) {
    return { skipped: true, id: duplicateByTitle.id }
  }

  const inserted = await supabaseServer
    .from('work_tool_boards')
    .insert(richPayload)
    .select('id')
    .single()

  if (!inserted.error) {
    return { skipped: false, id: inserted.data?.id }
  }

  if (inserted.error.code !== '42703') {
    throw inserted.error
  }

  const fallback = await supabaseServer
    .from('work_tool_boards')
    .insert({
      board_type: classification.boardType,
      title: classification.title,
      content,
      author_id: owner.id,
      author_name: owner.name || '관리자',
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (fallback.error) throw fallback.error
  return { skipped: false, id: fallback.data?.id, setupSql: 'database/alter_work_tool_drive_import.sql' }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ error: '관리자 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = Boolean(body.dryRun)

    const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
    const drive = google.drive({ version: 'v3', auth })
    const rootFolderId = await resolveDriveFolderId(drive, driveFolderId)
    const manualFolder = await ensureDriveFolder(drive, rootFolderId, MANUAL_FOLDER_NAME)

    const sourceOriginal = await ensureDriveFolder(drive, manualFolder.id!, SOURCE_ORIGINAL_FOLDER_NAME)
    const copiedFolder = await ensureDriveFolder(drive, sourceOriginal.id!, COPIED_FOLDER_NAME)

    const targetFolders = {
      SOP: await ensureDriveFolder(drive, manualFolder.id!, 'SOP'),
      Worktool: await ensureDriveFolder(drive, manualFolder.id!, 'Worktool'),
      Breakdown: await ensureDriveFolder(drive, manualFolder.id!, 'Breakdown'),
      engineerData: await ensureDriveFolder(drive, manualFolder.id!, 'engineerData')
    }

    const targetOriginalFolders = {
      SOP: await ensureDriveFolder(drive, targetFolders.SOP.id!, 'Original'),
      Worktool: await ensureDriveFolder(drive, targetFolders.Worktool.id!, 'Original'),
      Breakdown: await ensureDriveFolder(drive, targetFolders.Breakdown.id!, 'Original'),
      engineerData: await ensureDriveFolder(drive, targetFolders.engineerData.id!, 'Original')
    }

    const files = await listOriginalFiles(drive, sourceOriginal.id!)
    const results = []

    for (const file of files) {
      const classification = classifyWorkToolDocument(file.name || '', file.description || '')
      const targetFolder = targetOriginalFolders[classification.documentGroup]

      if (dryRun) {
        results.push({
          fileId: file.id,
          name: file.name,
          action: 'preview',
          classification
        })
        continue
      }

      const copied = await drive.files.copy({
        fileId: file.id!,
        requestBody: {
          name: file.name,
          parents: [targetFolder.id!]
        },
        fields: 'id, name, webViewLink'
      })

      const inserted = await insertBoardWithMetadata({
        owner,
        originalFile: file,
        copiedFile: copied.data,
        classification
      })

      await drive.files.update({
        fileId: file.id!,
        addParents: copiedFolder.id!,
        removeParents: sourceOriginal.id!,
        fields: 'id, parents, webViewLink'
      })

      results.push({
        fileId: file.id,
        name: file.name,
        copiedFileId: copied.data.id,
        boardId: inserted.id,
        skipped: inserted.skipped,
        setupSql: inserted.setupSql,
        classification
      })
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      count: files.length,
      results,
      folders: {
        rootFolderId,
        manualFolderId: manualFolder.id,
        originalFolderId: sourceOriginal.id,
        copiedFolderId: copiedFolder.id
      }
    })
  } catch (error) {
    console.error('Work tool Drive import error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Google Drive 업무도구 가져오기에 실패했습니다.',
      setupSql: 'database/alter_work_tool_drive_import.sql'
    }, { status: 500 })
  }
}
