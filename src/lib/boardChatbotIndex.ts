import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { chunkText } from '@/lib/chatbotManualSync'

// 게시판 글 → QR 챗봇 의미검색(machine_manual_chunks) 색인.
// 내 전용/SOP 게시판 글을 챗봇이 근거로 답할 수 있게 한다. (Gemini 임베딩 768차원)

const EMBED_DIM = 768
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// 게시판 말머리(한글) → machine_type / hardware_type 값 매핑
const MACHINE_MAP: Record<string, string | null> = {
  전삭기: 'wheel_lathe',
  선반: 'lathe',
  디스크선반: 'disc_lathe',
  탠덤: 'tandem',
  공통: null
}
const HARDWARE_MAP: Record<string, string | null> = {
  '840C': 'sinumerik_840c',
  '840D': 'sinumerik_840d',
  '840Dsl': 'sinumerik_840dsl',
  ONE: 'sinumerik_one',
  공통: null
}

export function machineLabelToType(label?: string): string | null {
  return label ? MACHINE_MAP[label] ?? null : null
}
export function hardwareLabelToType(label?: string): string | null {
  return label ? HARDWARE_MAP[label] ?? null : null
}

function l2normalize(values: number[]): number[] {
  let sum = 0
  for (const v of values) sum += v * v
  const norm = Math.sqrt(sum) || 1
  return values.map((v) => v / norm)
}

async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY
  const content = (text || '').trim()
  if (!apiKey || !content) return null
  try {
    const res = await fetch(`${GEMINI_BASE}/${EMBED_MODEL}:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: content.slice(0, 8000) }] },
        taskType: 'RETRIEVAL_DOCUMENT',
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

// HTML 본문에서 텍스트만 추출
function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 게시판 글 1건을 챗봇 의미검색 색인에 반영(기존 색인 삭제 후 재삽입, 멱등).
 * @returns 색인된 청크 수
 */
export async function indexBoardPost(opts: {
  postId: string
  title: string
  html: string
  machineType?: string | null
  hardwareType?: string | null
}): Promise<number> {
  const supabase = getSupabaseAdmin()
  const fileKey = `board_${opts.postId}`

  // 기존 색인 제거(수정/재색인 대비)
  await supabase.from('machine_manual_chunks').delete().eq('google_file_id', fileKey)

  const text = `${opts.title}\n\n${stripHtml(opts.html)}`.trim()
  const chunks = chunkText(text).slice(0, 20)
  if (!chunks.length) return 0

  const rows: any[] = []
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i])
    if (!embedding) continue
    rows.push({
      google_file_id: fileKey,
      manual_link_id: null,
      title: opts.title,
      chunk_index: i,
      content: chunks[i],
      embedding,
      machine_type: opts.machineType ?? null,
      hardware_type: opts.hardwareType ?? null,
      drive_url: '',
      visibility: 'public'
    })
  }
  if (rows.length) {
    const { error } = await supabase.from('machine_manual_chunks').insert(rows)
    if (error) throw error
  }
  return rows.length
}
