import type { BidItem } from './types'
import { searchG2bBids } from './g2bSearch'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const KORAIL_BASE_URL = 'https://ebid.korail.com'

export function getNaraItemKey(item: Pick<BidItem, 'url' | 'title' | 'category'>) {
  return `${item.category || ''}|${item.url}|${item.title}`.replace(/\s+/g, ' ').trim().toLowerCase()
}

function stableId(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return `korail-${Math.abs(hash)}`
}

function itemStatus(deadline: string): 'active' | 'ended' {
  if (!deadline) return 'active'
  const normalized = deadline.replace(/\./g, '-').replace(/\//g, '-')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return 'active'
  return date.getTime() < Date.now() ? 'ended' : 'active'
}

function yyyymmdd(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function parsePriceText(text: string) {
  return text.match(/[\d,]+\s*원/)?.[0] || ''
}

function parseDateText(text: string) {
  return text.match(/\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:\s+\d{1,2}:\d{2})?/)?.[0] || ''
}

// ─────────────────────────────────────────────
// RFC 기반 검색 (계약현황, 발주계획 - 잘 작동함)
// ─────────────────────────────────────────────

async function postKorailRfc(
  fn: string,
  params: Array<{ name: string; value_string: string }>,
  referer: string
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${KORAIL_BASE_URL}/comnRfc.do`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          'accept': 'application/json, text/javascript, */*; q=0.01',
          'x-requested-with': 'XMLHttpRequest',
          'referer': referer,
          'origin': KORAIL_BASE_URL
        },
        body: new URLSearchParams({
          p: JSON.stringify(params),
          fn: JSON.stringify({ ZFUNCNM: fn })
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(20000)
      })

      if (!response.ok) throw new Error(`Korail RFC ${response.status}`)
      const data = await response.json()
      return JSON.parse(data.data || '{}')
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Korail RFC fetch failed')
}

function addParam(params: Array<{ name: string; value_string: string }>, name: string, value = '') {
  params.push({ name, value_string: value })
}

function valuesFromRfcTable(response: Record<string, any>, tableName: string) {
  const itab = Array.isArray(response?.itab) ? response.itab : []
  const table = itab.find((item: any) => item.name === tableName)
  return Array.isArray(table?.value) ? table.value : []
}

function stringifyRecord(record: Record<string, any>) {
  return Object.values(record)
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function recordTitle(record: Record<string, any>) {
  return String(
    record.description || record.zzdesc || record.zzctrdesc ||
    record.maktx || record.zzmaktx || record.txz01 ||
    stringifyRecord(record)
  ).slice(0, 160)
}

function recordDate(record: Record<string, any>) {
  const value = record.zzbid_edat || record.zzbid_sdat || record.zzbid_erdat ||
    record.aedat || record.bedat || record.lfgja || ''
  const text = String(value)
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
  return parseDateText(text)
}

function recordUrl(record: Record<string, any>, category: string, fallbackUrl: string) {
  const detail = record.zzbidinv || record.zzbid_inv || record.zebidinv || record.ebeln || record.matnr || ''
  if (!detail) return fallbackUrl
  if (fallbackUrl.includes('/goods/inList.do')) {
    const params = new URLSearchParams({
      zzbidinv: String(record.zzbidinv || detail),
      zzstnum: String(record.zzstnum || '00'),
      erdat: String(record.zzbid_erdat || '')
    })
    return `${KORAIL_BASE_URL}/goods/inDetail.do?${params.toString()}`
  }
  return `${fallbackUrl}#${encodeURIComponent(category)}-${encodeURIComponent(String(detail))}`
}

function parseRfcRecords(
  records: Array<Record<string, any>>,
  keywords: string[],
  pageUrl: string,
  category: string
): BidItem[] {
  const normalized = keywords.map((k) => k.trim().toLowerCase()).filter(Boolean)

  return records
    .filter((record) => {
      if (normalized.length === 0) return true
      const searchable = recordTitle(record).toLowerCase()
      return normalized.some((kw) => searchable.includes(kw))
    })
    .map((record) => {
      const title = recordTitle(record)
      const url = recordUrl(record, category, pageUrl)
      const deadline = recordDate(record)
      const key = getNaraItemKey({ url, title, category })
      return {
        id: stableId(key),
        title,
        company: '한국철도공사',
        price: parsePriceText(stringifyRecord(record)),
        deadline,
        status: itemStatus(deadline),
        url,
        source: 'korail' as const,
        createdAt: new Date().toISOString(),
        description: stringifyRecord(record),
        category
      }
    })
}

/** 물품 계약현황 (RFC - 잘 작동함) */
async function fetchBidNoticeItems(keywords: string[]): Promise<BidItem[]> {
  const today = new Date()
  const past = new Date()
  past.setDate(today.getDate() - 90)
  const pageUrl = `${KORAIL_BASE_URL}/goods/inList.do`
  const terms = keywords.length > 0 ? keywords : ['']
  const merged = new Map<string, BidItem>()

  for (const keyword of terms) {
    const params: Array<{ name: string; value_string: string }> = []
    addParam(params, 'I_ZZBIDTYPECODE', '1')
    addParam(params, 'I_ZZCTRMETHOD')
    addParam(params, 'I_BSART')
    addParam(params, 'I_ZZBIDINV')
    addParam(params, 'I_DESCRIPTION', keyword)
    addParam(params, 'I_ERDAT_FR', yyyymmdd(past))
    addParam(params, 'I_ERDAT_TO', yyyymmdd(today))
    addParam(params, 'I_SDAT_FR')
    addParam(params, 'I_SDAT_TO')
    addParam(params, 'I_LIFNR')

    const response = await postKorailRfc('ZMME_EBID_INFO_0009F', params, pageUrl)
    const records = valuesFromRfcTable(response, 'ET_ZSMMEEBID0083')
    parseRfcRecords(records, keywords, pageUrl, '물품 입찰공고').forEach((item) => {
      merged.set(getNaraItemKey(item), item)
    })
  }

  return Array.from(merged.values())
}

async function fetchContractItems(keywords: string[]): Promise<BidItem[]> {
  const today = new Date()
  const past = new Date(); past.setDate(today.getDate() - 90)
  const pageUrl = `${KORAIL_BASE_URL}/goods/contList.do`

  const params: Array<{ name: string; value_string: string }> = []
  addParam(params, 'I_POART')
  addParam(params, 'I_EBELN')
  addParam(params, 'I_ZZCTRDESC', '')
  addParam(params, 'I_GUBUN')
  addParam(params, 'I_ZZCONTRWAY')
  addParam(params, 'I_ZZBIDINV')
  addParam(params, 'I_DAT_FR', yyyymmdd(past))
  addParam(params, 'I_DAT_TO', yyyymmdd(today))

  const response = await postKorailRfc('ZMME_EBID_INFO_0014', params, pageUrl)
  const records = valuesFromRfcTable(response, 'ET_ZSMMP1006')
  return parseRfcRecords(records, keywords, pageUrl, '물품 계약현황')
}

/** 구매발주계획 (RFC - 현재 + 이전 분기, 잘 작동함) */
async function fetchPlanItems(keywords: string[]): Promise<BidItem[]> {
  const pageUrl = `${KORAIL_BASE_URL}/plan/planList.do`
  const year = String(new Date().getFullYear())
  const q = Math.floor(new Date().getMonth() / 3) + 1
  const quarters = [{ year, q: String(q) }]
  if (q > 1) quarters.push({ year, q: String(q - 1) })
  else quarters.push({ year: String(Number(year) - 1), q: '4' })

  const merged = new Map<string, BidItem>()
  for (const { year: y, q: qStr } of quarters) {
    const params: Array<{ name: string; value_string: string }> = []
    addParam(params, 'I_LFGJA', y)
    addParam(params, 'I_GUBUN', '1')
    addParam(params, 'I_PLN', qStr)
    addParam(params, 'I_DEPT')
    addParam(params, 'I_MATNR')
    addParam(params, 'I_ZZMAKTX', '')
    try {
      const response = await postKorailRfc('ZMME_EBID_INFO_0002', params, pageUrl)
      const records = valuesFromRfcTable(response, 'ET_ZSMMEEBID0005')
      parseRfcRecords(records, keywords, pageUrl, '구매발주계획').forEach((item) => {
        merged.set(getNaraItemKey(item), item)
      })
    } catch {
      // 분기별 실패 시 무시
    }
  }
  return Array.from(merged.values())
}

// ─────────────────────────────────────────────
// Playwright 기반 검색 (입찰공고, 개찰결과 - RFC 보안으로 직접 호출 차단됨)
// ─────────────────────────────────────────────

async function getChromium() {
  // Vercel 서버리스 환경에서는 @sparticuz/chromium 사용
  // 로컬 개발 환경에서는 시스템 Chromium 사용
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
    const chromium = await import('@sparticuz/chromium').then(m => m.default)
    return { executablePath: await chromium.executablePath(), chromiumArgs: chromium.args }
  }
  // 로컬: playwright-core의 번들 Chromium 경로 직접 사용
  const { chromiumPath } = await import('./browserPath').catch(() => ({ chromiumPath: undefined }))
  return { executablePath: chromiumPath, chromiumArgs: [] }
}

async function launchBrowser() {
  const { chromium } = await import('playwright-core')
  const { executablePath, chromiumArgs } = await getChromium()

  const launchOptions = {
    executablePath: executablePath || undefined,
    args: [
      ...(chromiumArgs || []),
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    headless: true
  }

  await cleanupPlaywrightTemp()

  try {
    return await chromium.launch(launchOptions)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOSPC')) {
      await cleanupPlaywrightTemp()
      return chromium.launch(launchOptions)
    }
    throw error
  }
}

async function cleanupPlaywrightTemp() {
  const tempDir = os.tmpdir()
  let entries: string[] = []

  try {
    entries = await fs.readdir(tempDir)
  } catch {
    return
  }

  await Promise.allSettled(
    entries
      .filter((entry) =>
        entry.startsWith('playwright-') ||
        entry.startsWith('playwright_artifacts') ||
        entry.startsWith('playwright-artifacts') ||
        entry.startsWith('playwright_chromiumdev_profile-')
      )
      .map((entry) => fs.rm(path.join(tempDir, entry), { recursive: true, force: true }))
  )
}

/** 입찰공고 / 개찰결과 (Playwright - 실제 브라우저 자동화) */
async function fetchBidItemsViaPlaywright(
  browser: any,
  pageUrl: string,
  category: string,
  keywords: string[]
): Promise<BidItem[]> {
  const merged = new Map<string, BidItem>()

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    })

    const today = new Date()
    // DB 설정의 immediateSearchDays(검색 범위 일수)를 가져오고, 없으면 기본값 90일을 적용
    const { naraConfigManager } = await import('./config').catch(() => ({ naraConfigManager: { get: () => 90 } as any }))
    const immediateDays = naraConfigManager.get('immediateSearchDays') || 90
    const past = new Date(); past.setDate(today.getDate() - immediateDays)
    const dateFrom = formatDate(past)
    const dateTo = formatDate(today)

    // 키워드가 없으면 빈 문자열 한 번만 검색 (전체 조회)
    const searchTerms = keywords.length > 0 ? keywords : ['']

    for (const keyword of searchTerms) {
      const page = await context.newPage()
      try {
        await page.goto(`${KORAIL_BASE_URL}/main.do`, { waitUntil: 'domcontentloaded', timeout: 30000 })

        if (category.includes('입찰공고')) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
            page.evaluate(() => {
              const go = (window as any).fn_myFrame
              if (typeof go === 'function') go('/goods/inList.do', 'A03', '1')
            })
          ])
        } else if (category.includes('개찰결과')) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
            page.evaluate(() => {
              const go = (window as any).fn_myFrame
              if (typeof go === 'function') go('/goods/openList.do', 'A03', '1')
            })
          ])
        } else {
          await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
        }

        await page.waitForSelector('#searchErdatFr, #searchZedescbid, #btnSearch', { timeout: 15000 })

        // 날짜 설정 (공고일 시작)
        const fromInput = page.locator('#searchErdatFr')
        if (await fromInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await fromInput.fill(dateFrom)
          await page.evaluate((val) => {
            const el = document.querySelector('#searchErdatFr') as HTMLInputElement;
            if (el) {
              el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }
          }, dateFrom)
        }

        // 날짜 설정 (공고일 종료)
        const toInput = page.locator('#searchErdatTo')
        if (await toInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await toInput.fill(dateTo)
          await page.evaluate((val) => {
            const el = document.querySelector('#searchErdatTo') as HTMLInputElement;
            if (el) {
              el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }
          }, dateTo)
        }

        // 입찰공고명 키워드 입력
        const keywordInput = page.locator('#searchZedescbid')
        if (await keywordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await keywordInput.fill(keyword)
          await page.evaluate((val) => {
            const el = document.querySelector('#searchZedescbid') as HTMLInputElement
            if (el) {
              el.value = val
              el.dispatchEvent(new Event('input', { bubbles: true }))
              el.dispatchEvent(new Event('change', { bubbles: true }))
              el.dispatchEvent(new Event('blur', { bubbles: true }))
            }
          }, keyword)
        }

        // 조회 버튼 클릭
        const searchBtn = page.locator('#btnSearch, button:has-text("조회"), input[value="조회"], a:has-text("조회")')
        if (await searchBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchBtn.first().click()
        } else {
          await page.evaluate(() => {
            const search = (window as any).fnSearch
            if (typeof search === 'function') search()
          })
        }

        // SBGrid 렌더링을 위해 5초간 대기
        await page.waitForTimeout(5000)

        // 결과 행 스크래핑 (SBGrid/일반 테이블 포괄적 패턴 매칭 파싱)
        // 브라우저의 프로토타입 오염 등으로 인한 직렬화 오류를 방지하기 위해 JSON.stringify 사용
        const rowsJson = await page.evaluate(() => {
          try {
            const results: Array<{ title: string; url: string; deadline: string; price: string }> = []
            
            // 문서 내 모든 tr 태그 및 그리드 셀 탐색
            const rowsList = document.querySelectorAll('tr, .SBGrid-row, [class*="row"]');
            
            // 프로토타입 오염이나 구형 브라우저 호환성을 방지하기 위해 표준 for 루프 사용
            for (let i = 0; i < rowsList.length; i++) {
              const row = rowsList[i];
              const text = row.textContent?.replace(/\s+/g, ' ').trim() || '';
              // 7자리-2자리 공고번호 패턴 매칭 (예: 9255680-00)
              const bidNoMatch = text.match(/\d{7}-\d{2}/);
              if (!bidNoMatch) continue;
              
              const bidNo = bidNoMatch[0];
              
              // 날짜 패턴 매칭
              const dateMatches = text.match(/\d{4}[./-]\d{1,2}[./-]\d{1,2}/g) || [];
              const deadline = dateMatches[dateMatches.length - 1] || '';
              
              // 상세 URL 매칭
              let urlMatch = '';
              const linkEl = row.querySelector('a, [onclick]');
              if (linkEl) {
                const href = linkEl.getAttribute('href') || '';
                const onclick = linkEl.getAttribute('onclick') || '';
                const myFrameMatch = onclick.match(/fn_myFrame\('([^']+)'/);
                if (myFrameMatch) urlMatch = myFrameMatch[1];
                else if (href && !href.startsWith('javascript:')) urlMatch = href;
              }
              
              if (!urlMatch) {
                urlMatch = `/goods/inList.do?bidNo=${bidNo}`;
              }
              
              // 공고명(title) 추출 고도화: 공고번호 셀 다음 셀의 텍스트를 우선 추출
              let title = '';
              const cells = Array.from(row.querySelectorAll('td, div')).map(el => el.textContent?.trim() || '').filter(Boolean);
              if (cells.length > 2) {
                const bidNoIdx = cells.findIndex(c => c.includes(bidNo));
                if (bidNoIdx !== -1 && cells[bidNoIdx + 1]) {
                  title = cells[bidNoIdx + 1];
                }
              }
              
              if (!title) {
                const clickable = row.querySelector('a, [onclick], span, div');
                title = clickable?.textContent?.trim() || text.slice(0, 100);
              }
              
              results.push({
                title: title.slice(0, 160),
                url: urlMatch,
                deadline: deadline,
                price: text.match(/[\d,]+\s*원/)?.[0] || ''
              });
            }
            
            return JSON.stringify(results);
          } catch (e) {
            return JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown browser eval error' });
          }
        })

        const rowsParsed = JSON.parse(rowsJson || '[]')
        const rows = Array.isArray(rowsParsed) ? rowsParsed : []

        rows.forEach((row) => {
          const url = row.url
            ? (row.url.startsWith('http') ? row.url : `${KORAIL_BASE_URL}${row.url}`)
            : pageUrl
          const key = getNaraItemKey({ url, title: row.title, category })
          const deadline = row.deadline
          merged.set(key, {
            id: stableId(key),
            title: row.title,
            company: '한국철도공사',
            price: row.price,
            deadline,
            status: itemStatus(deadline),
            url,
            source: 'korail',
            createdAt: new Date().toISOString(),
            category
          })
        })
      } catch (err) {
        console.error(`[Playwright] ${category} 키워드="${keyword}" 스크래핑 실패:`, err)
      } finally {
        await page.close()
      }
    }

    await context.close()
  } catch (err) {
    console.error(`[Playwright] ${category} 실행 중 오류:`, err)
  }

  return Array.from(merged.values())
}

// ─────────────────────────────────────────────
// 메인 진입점
// ─────────────────────────────────────────────

export async function searchKorailBids(
  keywords: string[],
  options: { naraMarketApiKey?: string; includeNaraMarket?: boolean } = {}
): Promise<{ bids: BidItem[]; errors: string[] }> {
  const errors: string[] = []
  const allItems = new Map<string, BidItem>()

  try {
    const bidNoticeItems = await fetchBidNoticeItems(keywords)
    bidNoticeItems.forEach((item) => allItems.set(getNaraItemKey(item), item))
  } catch (err) {
    errors.push(`물품 입찰공고 RFC: ${err instanceof Error ? err.message : '검색 실패'}`)
  }

  // 3) 계약현황 - RFC 직접 호출 (잘 작동함)
  try {
    const contractItems = await fetchContractItems(keywords)
    contractItems.forEach((item) => allItems.set(getNaraItemKey(item), item))
  } catch (err) {
    errors.push(`물품 계약현황: ${err instanceof Error ? err.message : '검색 실패'}`)
  }

  // 4) 발주계획 - RFC 직접 호출 (잘 작동함)
  try {
    const planItems = await fetchPlanItems(keywords)
    planItems.forEach((item) => allItems.set(getNaraItemKey(item), item))
  } catch (err) {
    errors.push(`구매발주계획: ${err instanceof Error ? err.message : '검색 실패'}`)
  }

  if (options.includeNaraMarket !== false) {
    const g2bResult = await searchG2bBids(keywords, options.naraMarketApiKey)
    g2bResult.bids.forEach((item) => allItems.set(getNaraItemKey(item), item))
    errors.push(...g2bResult.errors)
  }

  const items = Array.from(allItems.values())
  const prioritized = [
    ...items.filter((item) => item.source === 'naramarket'),
    ...items.filter((item) => item.source !== 'naramarket')
  ]

  return {
    bids: prioritized.slice(0, 200),
    errors
  }
}
