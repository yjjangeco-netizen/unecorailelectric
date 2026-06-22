import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { getAssistantGoogleAuth, resolveDriveFolderId } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const MANUAL_FOLDER_NAME = 'manual'
const ORIGINAL_FOLDER_NAME = 'manual-original'
const COPIED_FOLDER_NAME = 'copied'

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function ensureFolder(drive: any, parentId: string, name: string) {
  const existing = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escapeDriveQuery(name)}' and '${escapeDriveQuery(parentId)}' in parents and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1
  })
  if (existing.data.files?.[0]?.id) {
    return existing.data.files[0]
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId]
    },
    fields: 'id, name'
  })
  return created.data
}

// Unecorail 루트 아래 및 드라이브 최상위(My Drive) 모두에서 폴더 검색 지원
async function findFolderAnywhere(drive: any, rootFolderId: string, name: string) {
  // 1. Unecorail 폴더 내부 조회
  const existingInRoot = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escapeDriveQuery(name)}' and '${escapeDriveQuery(rootFolderId)}' in parents and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1
  })
  if (existingInRoot.data.files?.[0]?.id) {
    return existingInRoot.data.files[0]
  }

  // 2. 구글 드라이브 최상위(My Drive) 조회
  const existingInMyDrive = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escapeDriveQuery(name)}' and 'root' in parents and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1
  })
  if (existingInMyDrive.data.files?.[0]?.id) {
    return existingInMyDrive.data.files[0]
  }

  return null
}

// manual-original 폴더 내의 모든 하위 파일들을 깊이에 상관없이 재귀적으로 전부 수집
async function listAllFilesRecursively(drive: any, folderId: string): Promise<any[]> {
  const allFiles: any[] = []

  async function traverse(dirId: string) {
    const list = await drive.files.list({
      q: `'${escapeDriveQuery(dirId)}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, parents)'
    })

    for (const file of list.data.files || []) {
      if (file.mimeType === FOLDER_MIME) {
        await traverse(file.id)
      } else {
        allFiles.push(file)
      }
    }
  }

  await traverse(folderId)
  return allFiles
}

// 스마트 분류 규칙
function classifyFile(fileName: string): string {
  const name = fileName.toLowerCase()
  if (/(sop)/.test(name)) {
    return 'SOP'
  }
  if (/(고장|대응|에러|알람|조치|breakdown|trouble|troubleshooting)/.test(name)) {
    return 'Breakdown'
  }
  if (/(기술|설계|자료|도면|data|engineer|engineering)/.test(name)) {
    return 'engineerData'
  }
  if (/(툴|프로그램|매크로|worktool|tool)/.test(name)) {
    return 'Worktool'
  }
  // 기본 분류
  return 'Worktool'
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
    if (!owner) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
    const drive = google.drive({ version: 'v3', auth })
    const rootFolderId = await resolveDriveFolderId(drive, driveFolderId)

    // 1. 폴더들 확인 및 생성
    const manualFolder = await ensureFolder(drive, rootFolderId, MANUAL_FOLDER_NAME)
    const copiedFolder = await ensureFolder(drive, manualFolder.id!, COPIED_FOLDER_NAME)

    // manual-original은 어디에 올라와도 찾을 수 있게 다각도로 조회
    let originalFolder = await findFolderAnywhere(drive, rootFolderId, ORIGINAL_FOLDER_NAME)
    if (!originalFolder) {
      // 존재하지 않을 경우에만 Unecorail 하위에 생성
      originalFolder = await ensureFolder(drive, rootFolderId, ORIGINAL_FOLDER_NAME)
    }

    console.log(`[Drive Classify] 타겟 manual-original 폴더 ID: ${originalFolder.id}`)

    // 2. manual-original 내의 모든 파일들 재귀적으로 수집
    const files = await listAllFilesRecursively(drive, originalFolder.id!)
    console.log(`[Drive Classify] 발견된 원본 파일 개수: ${files.length}개`, files.map(f => f.name))

    if (files.length === 0) {
      return NextResponse.json({ success: true, message: '분류할 파일이 manual-original 폴더에 없습니다.', count: 0 })
    }

    let classifiedCount = 0

    for (const file of files) {
      const targetDirName = classifyFile(file.name)
      console.log(`[Drive Classify] 파일 분류 진행: "${file.name}" -> 분류: "${targetDirName}"`)
      
      // manual/{targetDirName} 폴더 확보
      const targetFolder = await ensureFolder(drive, manualFolder.id!, targetDirName)
      // manual/{targetDirName}/original 폴더 확보
      const originalSubFolder = await ensureFolder(drive, targetFolder.id!, 'original')

      console.log(`[Drive Classify] 복사 시도: "${file.name}" -> "${targetDirName}/original/"`)

      // 파일 복사 실행 (target/original로 복사)
      await drive.files.copy({
        fileId: file.id,
        requestBody: {
          name: file.name,
          parents: [originalSubFolder.id!]
        }
      })

      // 파일의 실제 부모들을 구하여 이동 처리 진행 (removeParents에 실제 부모 ID 대입)
      const currentParents = file.parents?.join(',') || ''
      if (currentParents) {
        await drive.files.update({
          fileId: file.id!,
          addParents: copiedFolder.id!,
          removeParents: currentParents,
          fields: 'id, parents'
        })
      }

      classifiedCount += 1
    }

    return NextResponse.json({
      success: true,
      message: `${classifiedCount}개의 파일이 스마트 분류되어 저장되었습니다.`,
      count: classifiedCount
    })
  } catch (error) {
    console.error('스마트 분류 실패 상세 에러 스택:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '스마트 분류 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
