import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getAssistantGoogleAuth, resolveDriveFolderId } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

type DriveClient = ReturnType<typeof google.drive>

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const MANUAL_FOLDER_NAME = 'manual'

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function ensureDriveFolder(drive: DriveClient, parentId: string, name: string) {
  const existing = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escapeDriveQuery(name)}' and '${escapeDriveQuery(parentId)}' in parents and trashed=false`,
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

function getPreviewUrl(file: any) {
  const id = file.id
  if (!id) return file.webViewLink || ''

  if (file.mimeType === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${id}/preview`
  }
  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${id}/preview`
  }
  if (file.mimeType === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${id}/preview`
  }

  return `https://drive.google.com/file/d/${id}/preview`
}

async function listChildren(drive: DriveClient, folderId: string, depth = 0): Promise<any[]> {
  const items: any[] = []
  let pageToken: string | undefined

  do {
    const result = await drive.files.list({
      q: `'${escapeDriveQuery(folderId)}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, modifiedTime, size, parents)',
      orderBy: 'folder,name',
      pageSize: 100,
      spaces: 'drive',
      pageToken
    })

    for (const file of result.data.files || []) {
      const isFolder = file.mimeType === FOLDER_MIME
      const node = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        previewUrl: isFolder ? null : getPreviewUrl(file),
        iconLink: file.iconLink,
        modifiedTime: file.modifiedTime,
        size: file.size,
        type: isFolder ? 'folder' : 'file',
        children: [] as any[]
      }

      if (isFolder && file.id && depth < 5) {
        node.children = await listChildren(drive, file.id, depth + 1)
      }

      items.push(node)
    }

    pageToken = result.data.nextPageToken || undefined
  } while (pageToken)

  return items
}

export async function GET(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ error: '관리자 전용 기능입니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetFolder = searchParams.get('folder') // 예: 'SOP', 'Breakdown', 'engineerData'

    const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
    const drive = google.drive({ version: 'v3', auth })
    const rootFolderId = await resolveDriveFolderId(drive, driveFolderId)
    const manualFolder = await ensureDriveFolder(drive, rootFolderId, MANUAL_FOLDER_NAME)

    if (targetFolder) {
      // 특정 서브폴더 하위의 'original' 폴더 확보 후 1 depth로 신속 조회
      const subFolder = await ensureDriveFolder(drive, manualFolder.id!, targetFolder)
      const originalSubFolder = await ensureDriveFolder(drive, subFolder.id!, 'original')

      const listResult = await drive.files.list({
        q: `'${escapeDriveQuery(originalSubFolder.id!)}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink, iconLink, modifiedTime, size)',
        orderBy: 'folder,name',
        pageSize: 100,
        spaces: 'drive'
      })

      const children = (listResult.data.files || []).map((file) => {
        const isFolder = file.mimeType === FOLDER_MIME
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          previewUrl: isFolder ? null : getPreviewUrl(file),
          iconLink: file.iconLink,
          modifiedTime: file.modifiedTime,
          size: file.size,
          type: isFolder ? 'folder' : 'file',
          path: `${MANUAL_FOLDER_NAME}/${targetFolder}/original/${file.name}`
        }
      })

      return NextResponse.json({
        ok: true,
        root: {
          id: originalSubFolder.id,
          name: 'original',
          type: 'folder',
          webViewLink: originalSubFolder.webViewLink,
          children
        }
      })
    }

    // folder 파라미터가 없으면 기존의 전체 5 depth 재귀 탐색 수행
    const children = await listChildren(drive, manualFolder.id!)

    return NextResponse.json({
      ok: true,
      root: {
        id: manualFolder.id,
        name: MANUAL_FOLDER_NAME,
        type: 'folder',
        webViewLink: manualFolder.webViewLink,
        children
      }
    })
  } catch (error) {
    console.error('Work tool Drive library error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Google Drive 문서 라이브러리를 불러오지 못했습니다.'
    }, { status: 500 })
  }
}
