import { google } from 'googleapis'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// 구글 드라이브 매뉴얼 → 챗봇 의미검색(임베딩 RAG) 동기화.
// QR_KAKAO 챗봇이 읽는 machine_manual_links(요약+링크) + machine_manual_chunks(임베딩)에 저장한다.
// 알람 관리(/api/chatbot-alarms)와 같은 챗봇 데이터 영역. 임베딩은 Gemini(gemini-embedding-001, 768차원).

const EMBED_DIM = 768
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document'
const BATCH_SIZE = 3 // OCR+임베딩이 느려 한 번에 3개씩, 미색인 파일 우선
const EXTRACT_CHARS = 30000
const MAX_CHUNKS = 30

type DriveClient = ReturnType<typeof google.drive>
type DriveFile = { id: string; name: string; mimeType: string; webViewLink?: string }

// ── 임베딩 ────────────────────────────────────────────────
function l2normalize(values: number[]): number[] {
  let sum = 0
  for (const v of values) sum += v * v
  const norm = Math.sqrt(sum) || 1
  return values.map((v) => v / norm)
}

async function embedText(
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'
): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY
  const content = (text || '').trim()
  if (!apiKey || !content) return null
  try {
    const res = await fetch(`${GEMINI_BASE}/${EMBED_MODEL}:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: content.slice(0, 8000) }] },
        taskType,
        outputDimensionality: EMBED_DIM
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    const values = data?.embedding?.values
    if (!Array.isArray(values) || values.length !== EMBED_DIM) return null
    return l2normalize(values)
  } catch {
    return null
  }
}

async function embedMany(texts: string[], concurrency = 4): Promise<(number[] | null)[]> {
  const out: (number[] | null)[] = new Array(texts.length).fill(null)
  let cursor = 0
  async function worker() {
    while (cursor < texts.length) {
      const i = cursor++
      out[i] = await embedText(texts[i], 'RETRIEVAL_DOCUMENT')
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, texts.length) }, () => worker())
  )
  return out
}

// ── 청크/요약/태깅 ─────────────────────────────────────────
export function chunkText(text: string, size = 900, overlap = 150): string[] {
  const clean = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!clean) return []
  const chunks: string[] = []
  let i = 0
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length)
    if (end < clean.length) {
      const slice = clean.slice(i, end)
      const boundary = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('。')
      )
      if (boundary > size * 0.5) end = i + boundary + 1
    }
    const piece = clean.slice(i, end).trim()
    if (piece) chunks.push(piece)
    if (end >= clean.length) break
    i = Math.max(end - overlap, i + 1)
  }
  return chunks
}

function inferHardwareType(name: string): string | null {
  const n = name.toLowerCase().replace(/\s+/g, '')
  if (/840dsl|840d-sl|840dasl/.test(n)) return 'sinumerik_840dsl'
  if (/840c/.test(n)) return 'sinumerik_840c'
  if (/840d/.test(n)) return 'sinumerik_840d'
  if (/828d/.test(n)) return null
  if (/sinumerikone|\bone\b/.test(n)) return 'sinumerik_one'
  if (/fanuc/.test(n)) return 'fanuc'
  return null
}

function inferMachineType(name: string): string | null {
  const n = name.toLowerCase()
  if (/전삭기|차륜전삭|차륜삭정/.test(name) || /wheel\s*lathe|wheellathe/.test(n)) return 'wheel_lathe'
  if (/탠덤|tandem/.test(name)) return 'tandem'
  if (/디스크|disc/.test(name)) return 'disc_lathe'
  if (/트램|tram/.test(name)) return 'tram'
  if (/선반|lathe/.test(name)) return 'lathe'
  return null
}

function fileNameToTitle(name: string): string {
  return String(name || '매뉴얼').replace(/\.[a-z0-9]+$/i, '').trim() || '매뉴얼'
}

function fallbackSummary(name: string): string {
  const base = String(name || '매뉴얼').replace(/\.[a-z0-9]+$/i, '').trim()
  return `${base} 관련 매뉴얼입니다. 자세한 내용은 첨부 매뉴얼을 확인하세요.`
}

function safeParseJson(raw: string | null): any {
  if (!raw) return null
  const m = String(raw).match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    return JSON.parse(m[0])
  } catch {
    return null
  }
}

async function buildSummary(name: string, text: string) {
  const machine_type = inferMachineType(name)
  const hardware_type = inferHardwareType(name)
  const cleanName = fileNameToTitle(name)
  const body = (text || '').trim()
  const groqKey = process.env.GROQ_API_KEY

  if (!groqKey || body.length < 80) {
    return { summary: fallbackSummary(name), tags: [cleanName].filter(Boolean), machine_type, hardware_type }
  }

  const system = [
    '너는 철도 차륜 선반/전삭기 정비 매뉴얼을 색인하는 도우미다.',
    '주어진 매뉴얼 본문을 현장 작업자가 한눈에 파악하도록 한국어로 정리한다.',
    '반드시 아래 JSON 형식만 출력한다. 다른 말은 절대 붙이지 않는다.',
    '{"summary":"3~5문장 요약","tags":["검색키워드","최대 8개"]}',
    '본문에 없는 내용은 지어내지 않는다.'
  ].join('\n')
  const user = `[파일명] ${cleanName}\n\n[본문]\n${body.slice(0, 9000)}`

  let raw: string | null = null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    })
    if (res.ok) {
      const data = await res.json()
      raw = data.choices?.[0]?.message?.content || null
    }
  } catch {
    raw = null
  }

  const parsed = safeParseJson(raw)
  const summary = (parsed?.summary && String(parsed.summary).trim()) || fallbackSummary(name)
  const tags = Array.isArray(parsed?.tags)
    ? parsed.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 8)
    : [cleanName].filter(Boolean)
  return { summary, tags, machine_type, hardware_type }
}

// ── 드라이브(googleapis) ───────────────────────────────────
async function listFolderFiles(drive: DriveClient, folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = []
  let pageToken: string | undefined
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
      pageSize: 200,
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken
    })
    for (const f of res.data.files || []) {
      if (f.mimeType !== 'application/vnd.google-apps.folder') {
        files.push({
          id: f.id as string,
          name: (f.name as string) || '',
          mimeType: (f.mimeType as string) || '',
          webViewLink: f.webViewLink || undefined
        })
      }
    }
    pageToken = res.data.nextPageToken || undefined
  } while (pageToken)
  return files
}

// PDF/이미지는 OCR(구글닥 변환) 후 텍스트, 구글문서는 그대로 export. 실패해도 ''.
async function extractText(drive: DriveClient, file: DriveFile, maxChars = EXTRACT_CHARS): Promise<string> {
  const isPdf = file.mimeType === 'application/pdf'
  const isImage = file.mimeType.startsWith('image/')
  const isDoc = file.mimeType === GOOGLE_DOC_MIME
  if (!isPdf && !isImage && !isDoc) return ''

  let docId = file.id
  let tempId: string | null = null
  try {
    if (isPdf || isImage) {
      const copy = await drive.files.copy({
        fileId: file.id,
        ocrLanguage: 'ko',
        supportsAllDrives: true,
        fields: 'id',
        requestBody: { name: `__ocr_tmp_${file.name}`, mimeType: GOOGLE_DOC_MIME }
      })
      if (!copy.data.id) return ''
      docId = copy.data.id
      tempId = copy.data.id
    }
    const exp = await drive.files.export(
      { fileId: docId, mimeType: 'text/plain' },
      { responseType: 'text' }
    )
    const text = typeof exp.data === 'string' ? exp.data : String(exp.data || '')
    return text.replace(/^﻿/, '').trim().slice(0, maxChars)
  } catch {
    return ''
  } finally {
    if (tempId) {
      try {
        await drive.files.delete({ fileId: tempId, supportsAllDrives: true })
      } catch {
        /* 임시본 삭제 실패는 무시 */
      }
    }
  }
}

function manualTypeForMime(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType === GOOGLE_DOC_MIME) return 'google_docs'
  if (mimeType.startsWith('video/')) return 'video'
  return 'google_drive_file'
}

export function parseDriveFolderId(input: string): string {
  const value = String(input || '').trim()
  if (!value) return ''
  const m = value.match(/[-\w]{25,}/)
  return m ? m[0] : value
}

// ── 메인: 드라이브 폴더 동기화 ─────────────────────────────
export type SyncResult = {
  ok: boolean
  created: number
  failed: number
  removed: number
  indexedChunks: number
  totalFiles: number
  remaining: number
  message: string
}

export async function syncManualsFromDrive(opts: {
  auth: any
  folderId: string
}): Promise<SyncResult> {
  const folderId = parseDriveFolderId(opts.folderId)
  if (!folderId) throw new Error('드라이브 폴더 링크 또는 ID를 입력하세요.')

  const drive = google.drive({ version: 'v3', auth: opts.auth })
  const supabase = getSupabaseAdmin()

  const files = await listFolderFiles(drive, folderId)
  const driveIds = new Set(files.map((f) => f.id))

  // 이 폴더에서 동기화됐던 매뉴얼 중 드라이브에서 사라진 것 = DB에서도 제거
  // (구글 드라이브에서 직접 파일을 빼면 동기화 시 챗봇에서도 빠진다)
  let removed = 0
  const { data: folderManuals } = await supabase
    .from('machine_manual_links')
    .select('id, google_file_id')
    .eq('document_group', folderId)
    .not('google_file_id', 'is', null)
  for (const m of folderManuals || []) {
    if (!driveIds.has(m.google_file_id)) {
      await supabase.from('machine_manual_chunks').delete().eq('google_file_id', m.google_file_id)
      await supabase.from('machine_manual_links').delete().eq('id', m.id)
      removed += 1
    }
  }

  if (!files.length) {
    return {
      ok: true, created: 0, failed: 0, removed, indexedChunks: 0, totalFiles: 0, remaining: 0,
      message: removed ? `드라이브에서 삭제된 ${removed}건을 챗봇에서 제거했습니다.` : '폴더에 파일이 없습니다.'
    }
  }

  const { data: existingRows } = await supabase
    .from('machine_manual_links')
    .select('id, google_file_id')
    .not('google_file_id', 'is', null)
  const existingById = new Map<string, string>((existingRows || []).map((r: any) => [r.google_file_id, r.id]))

  const pending = files.filter((f) => !existingById.has(f.id))
  if (!pending.length) {
    const parts = [`이미 모든 파일(${files.length}건)이 동기화되어 있습니다.`]
    if (removed) parts.push(`드라이브 삭제분 ${removed}건 제거`)
    return {
      ok: true, created: 0, failed: 0, removed, indexedChunks: 0, totalFiles: files.length, remaining: 0,
      message: parts.join(' · ')
    }
  }

  const batch = pending.slice(0, BATCH_SIZE)
  let created = 0
  let failed = 0
  let indexedChunks = 0

  for (const file of batch) {
    try {
      const text = await extractText(drive, file)
      const { summary, tags, machine_type, hardware_type } = await buildSummary(file.name, text)
      const link = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
      const title = fileNameToTitle(file.name)

      const payload = {
        machine_profile_id: null,
        manual_type: manualTypeForMime(file.mimeType),
        title,
        description: summary.slice(0, 500),
        google_file_id: file.id,
        google_drive_url: link,
        public_view_url: link,
        document_group: folderId,
        machine_type,
        hardware_type,
        tags,
        visibility: 'public',
        is_active: true,
        body_markdown: summary
      }

      let manualLinkId = existingById.get(file.id) || null
      if (manualLinkId) {
        const { error } = await supabase.from('machine_manual_links').update(payload).eq('id', manualLinkId)
        if (error) throw error
      } else {
        const { data: inserted, error } = await supabase
          .from('machine_manual_links')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        manualLinkId = inserted?.id || null
      }
      created += 1

      // 의미검색 청크 색인
      const chunks = chunkText(text).slice(0, MAX_CHUNKS)
      await supabase.from('machine_manual_chunks').delete().eq('google_file_id', file.id)
      if (chunks.length) {
        const vectors = await embedMany(chunks)
        const rows = chunks
          .map((content, idx) => ({
            google_file_id: file.id,
            manual_link_id: manualLinkId,
            title,
            chunk_index: idx,
            content,
            embedding: vectors[idx],
            machine_type,
            hardware_type,
            drive_url: link,
            visibility: 'public'
          }))
          .filter((r) => Array.isArray(r.embedding))
        if (rows.length) {
          const { error } = await supabase.from('machine_manual_chunks').insert(rows)
          if (error) throw error
          indexedChunks += rows.length
        }
      }
    } catch {
      failed += 1
    }
  }

  const remaining = pending.length - batch.length
  const parts = [`매뉴얼 ${created}건 동기화 완료`]
  if (indexedChunks) parts.push(`의미검색 ${indexedChunks}조각 색인`)
  if (removed) parts.push(`드라이브 삭제분 ${removed}건 제거`)
  if (failed) parts.push(`실패 ${failed}건`)
  if (remaining > 0) parts.push(`남은 ${remaining}건 — 동기화를 다시 눌러주세요`)
  else parts.push(`전체 ${files.length}건 완료`)

  return { ok: true, created, failed, removed, indexedChunks, totalFiles: files.length, remaining, message: parts.join(' · ') }
}
