// 알람 CSV 다운로드/업로드 공용 매핑·헬퍼

export const MT_VALUE_TO_LABEL: Record<string, string> = {
  lathe: '선반',
  wheel_lathe: '전삭기',
  disc_lathe: '디스크선반',
  tram: '트램',
  tandem: '탠덤'
}

export function machineTypeToValue(input: string): string {
  const s = (input || '').trim()
  const lower = s.toLowerCase()
  const map: Record<string, string> = {
    선반: 'lathe', cncwl: 'lathe', lathe: 'lathe',
    전삭기: 'wheel_lathe', cncuwl: 'wheel_lathe', wheel_lathe: 'wheel_lathe',
    디스크선반: 'disc_lathe', cncdwl: 'disc_lathe', disc_lathe: 'disc_lathe',
    트램: 'tram', cnctwl: 'tram', tram: 'tram',
    탠덤: 'tandem', tandem: 'tandem'
  }
  return map[s] || map[lower] || lower
}

export const CTRL_VALUE_TO_LABEL: Record<string, string> = {
  sinumerik_840c: '840C',
  sinumerik_840d: '840D',
  sinumerik_840dsl: '840Dsl',
  sinumerik_one: 'One',
  fanuc: 'Fanuc'
}

export function controllerToValue(input: string): string {
  const n = (input || '').toUpperCase().replace(/[\s_]/g, '')
  if (n.includes('FANUC')) return 'fanuc'
  if (n.includes('ONE') || n.includes('SINUONE')) return 'sinumerik_one'
  if (n.includes('DSL')) return 'sinumerik_840dsl'
  if (n.includes('840C') || n === 'C') return 'sinumerik_840c'
  if (n.includes('840D') || n === 'D') return 'sinumerik_840d'
  // 이미 정규값이면 그대로
  return (input || '').trim().toLowerCase()
}

export function severityToCode(input: string): string {
  const s = (input || '').trim().toUpperCase()
  if (s === 'ALARM') return 'high'
  if (s === 'MESSAGE') return 'normal'
  const low = (input || '').trim().toLowerCase()
  return ['low', 'normal', 'medium', 'high', 'critical'].includes(low) ? low : 'normal'
}

export function reqDisk(input: string): boolean {
  return ['Y', '1', 'TRUE', 'DISK', '디스크'].includes((input || '').trim().toUpperCase())
}

// CSV 한 셀 이스케이프 (쉼표·따옴표·줄바꿈 포함 시 따옴표 처리)
export function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// CSV 파싱 (따옴표 지원). 구분자 자동(탭/쉼표).
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] || ''
  const delim = firstLine.includes('\t') ? '\t' : ','
  const rows: string[][] = []
  let cur = '', row: string[] = [], q = false
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (q) {
      if (c === '"') { if (clean[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === delim) { row.push(cur); cur = '' }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c === '\r') { /* skip */ }
      else cur += c
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}
